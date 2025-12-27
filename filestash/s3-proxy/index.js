/**
 * S3 Auth Proxy for Filestash → Supabase Storage
 *
 * Virtual folder structure:
 *   /my-files/profile/*  → profile-images/{userId}/*
 *   /my-files/media/*    → comedian-media/{userId}/*
 *   /my-files/*          → users/{userId}/*
 *   /org-{slug}/*        → organization-media/{orgId}/*
 *
 * Environment:
 * - SUPABASE_URL (e.g., https://xxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY (for org queries)
 * - SUPABASE_PROJECT_REF (e.g., pdikjpfulhhpqpxzpgtu)
 * - SUPABASE_S3_ACCESS_KEY
 * - SUPABASE_S3_SECRET_KEY
 * - SUPABASE_STORAGE_BUCKET (default: media-library)
 * - PORT (default: 9000)
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import aws4 from 'aws4';

const PORT = process.env.PORT || 9000;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const S3_ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.SUPABASE_S3_SECRET_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media-library';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SKIP_AUTH = process.env.SKIP_AUTH === 'true';

// Supabase Storage S3 endpoint
const SUPABASE_S3_HOST = `${PROJECT_REF}.supabase.co`;
const SUPABASE_S3_PATH = '/storage/v1/s3';

/**
 * Strip AWS authentication headers from request headers
 * These will be replaced with our own signed headers
 */
function stripAwsHeaders(headers) {
  const cleaned = { ...headers };
  // Remove all AWS-related headers
  delete cleaned['authorization'];
  delete cleaned['x-amz-date'];
  delete cleaned['x-amz-content-sha256'];
  delete cleaned['x-amz-security-token'];
  delete cleaned['x-filestash-token'];
  // Remove any other x-amz-* headers
  Object.keys(cleaned).forEach(key => {
    if (key.toLowerCase().startsWith('x-amz-')) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

/**
 * Sign request with AWS Signature V4 using Supabase S3 credentials
 */
function signRequest(method, path, headers, body) {
  const opts = {
    service: 's3',
    region: 'us-east-1', // Supabase uses us-east-1 for S3 signing
    host: SUPABASE_S3_HOST,
    method: method,
    path: path,
    headers: {
      ...headers,
      host: SUPABASE_S3_HOST,
    },
  };

  // For PUT/POST with body, include content hash
  if (body && (method === 'PUT' || method === 'POST')) {
    opts.body = body;
  }

  // Sign the request
  aws4.sign(opts, {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  });

  return opts.headers;
}

// Org membership cache (userId -> { orgs: [...], expires: timestamp })
const orgCache = new Map();
// Comedian slug cache (userId -> { slug: string, expires: timestamp })
const comedianSlugCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Validate required env vars
const missingVars = [];
if (!PROJECT_REF) missingVars.push('SUPABASE_PROJECT_REF');
if (!S3_ACCESS_KEY) missingVars.push('SUPABASE_S3_ACCESS_KEY');
if (!S3_SECRET_KEY) missingVars.push('SUPABASE_S3_SECRET_KEY');
if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(v => console.error(`- ${v}`));
  process.exit(1);
}

// Initialize Supabase client for org queries
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Validate Supabase JWT token and extract user_id
 */
function validateToken(req) {
  // Token comes from Filestash as x-amz-security-token header (Session Token auth)
  // or from our custom x-filestash-token header
  let token = req.headers['x-amz-security-token'] || req.headers['x-filestash-token'];

  if (!token) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    token = url.searchParams.get('token');
  }

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    // Decode without verification first to get the user_id
    // Full verification would require JWKS or JWT_SECRET
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return { valid: false, error: 'Invalid token: no subject claim' };
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }

    // If JWT_SECRET is set, verify signature
    if (JWT_SECRET) {
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (verifyErr) {
        return { valid: false, error: `Token verification failed: ${verifyErr.message}` };
      }
    }

    return {
      valid: true,
      payload: decoded,
      userId: decoded.sub
    };
  } catch (err) {
    return { valid: false, error: `Invalid token: ${err.message}` };
  }
}

/**
 * Get user's organizations (with caching)
 */
async function getUserOrgs(userId) {
  // Check cache first
  const cached = orgCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.orgs;
  }

  try {
    // Query organizations where user is owner
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from('organization_profiles')
      .select('id, url_slug')
      .eq('owner_id', userId);

    if (ownedError) {
      console.error('Error fetching owned orgs:', ownedError);
    }

    // Query organizations where user is a member (if table exists)
    // Note: organization_members table may not exist in all setups
    let memberOrgs = [];
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, organization_profiles!inner(id, url_slug)')
        .eq('user_id', userId);

      if (!error && data) {
        memberOrgs = data.map(m => ({
          id: m.organization_profiles.id,
          url_slug: m.organization_profiles.url_slug
        }));
      }
    } catch (e) {
      // Table might not exist, that's ok
    }

    // Combine and deduplicate
    const allOrgs = [...(ownedOrgs || []), ...memberOrgs];
    const uniqueOrgs = Array.from(
      new Map(allOrgs.map(o => [o.id, { id: o.id, slug: o.url_slug }])).values()
    );

    // Cache the result
    orgCache.set(userId, { orgs: uniqueOrgs, expires: Date.now() + CACHE_TTL });

    return uniqueOrgs;
  } catch (err) {
    console.error('Error fetching user orgs:', err);
    return [];
  }
}

/**
 * Translate virtual path to real storage bucket and path
 *
 * Clean storage structure in media-library bucket:
 *   {userId}/my-files/profile/Profile Images/...
 *   {userId}/my-files/profile/Profile Banners/...
 *   {userId}/my-files/profile/Headshots/...
 *   {userId}/my-files/profile/Press Shots/...
 *   {userId}/my-files/media/Photos/...
 *   {userId}/my-files/media/Videos/...
 *   {orgId}/org-files/...
 *
 * Returns { bucket, path } or null for virtual-only paths (handled separately)
 */
function translatePath(virtualPath, userId, orgs) {
  const normalized = virtualPath.replace(/^\/+/, '').replace(/\/+$/, '');

  // Root listing - handled separately
  if (!normalized) {
    return null;
  }

  // my-files/* → media-library bucket, path: {userId}/my-files/*
  if (normalized === 'my-files' || normalized.startsWith('my-files/')) {
    return {
      bucket: 'media-library',
      path: `${userId}/${normalized}`
    };
  }

  // org-{slug}/* → media-library bucket, path: {orgId}/org-files/*
  const orgMatch = normalized.match(/^org-([^/]+)(\/.*)?$/);
  if (orgMatch) {
    const [, slug, rest] = orgMatch;
    const org = orgs.find(o => o.slug === slug);
    if (!org) {
      throw new Error(`Access denied: not a member of organization '${slug}'`);
    }
    const subPath = (rest || '').replace(/^\//, '');
    return {
      bucket: 'media-library',
      path: `${org.id}/org-files${subPath ? '/' + subPath : ''}`
    };
  }

  throw new Error(`Invalid path: ${virtualPath}`);
}

// Default folder structure for user profiles (EPK)
const PROFILE_SUBFOLDERS = ['Profile Images', 'Profile Banners', 'Headshots', 'Press Shots'];
// Media folders for social scheduling
const MEDIA_SUBFOLDERS = ['Photos', 'Videos'];

/**
 * Generate S3 ListBucketResult XML
 */
function generateListBucketXml(bucket, prefix, contents, commonPrefixes) {
  const escapeXml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const contentsXml = contents.map(item => `
    <Contents>
      <Key>${escapeXml(item.key)}</Key>
      <LastModified>${item.lastModified}</LastModified>
      <Size>${item.size || 0}</Size>
      <StorageClass>STANDARD</StorageClass>
    </Contents>`).join('');

  const prefixesXml = commonPrefixes.map(p => `
    <CommonPrefixes>
      <Prefix>${escapeXml(p)}</Prefix>
    </CommonPrefixes>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>${escapeXml(bucket)}</Name>
  <Prefix>${escapeXml(prefix || '')}</Prefix>
  <Marker></Marker>
  <MaxKeys>1000</MaxKeys>
  <IsTruncated>false</IsTruncated>
  ${contentsXml}
  ${prefixesXml}
</ListBucketResult>`;
}

/**
 * The virtual path prefix that Filestash expects.
 * Filestash has Path set to "media-library" but doesn't include it in S3 requests.
 * It expects responses to have this prefix so it can match its internal filtering.
 */
const VIRTUAL_PREFIX = 'media-library';

/**
 * Handle root-level LIST request - return virtual folders
 * Always returns prefixes with VIRTUAL_PREFIX since that's what Filestash expects.
 */
function handleRootList(res, orgs) {
  const commonPrefixes = [
    `${VIRTUAL_PREFIX}/my-files/`
  ];

  // Add org folders
  for (const org of orgs) {
    if (org.slug) {
      commonPrefixes.push(`${VIRTUAL_PREFIX}/org-${org.slug}/`);
    }
  }

  const xml = generateListBucketXml(BUCKET, '', [], commonPrefixes);
  console.log(`[handleRootList] Returning ${commonPrefixes.length} folders:`, commonPrefixes);
  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(xml);
}

/**
 * Handle my-files LIST request - return profile and media subfolders
 * Always uses VIRTUAL_PREFIX since that's what Filestash expects.
 */
function handleMyFilesList(res) {
  const commonPrefixes = [
    `${VIRTUAL_PREFIX}/my-files/profile/`,
    `${VIRTUAL_PREFIX}/my-files/media/`
  ];
  const xml = generateListBucketXml(BUCKET, `${VIRTUAL_PREFIX}/my-files/`, [], commonPrefixes);
  console.log(`[handleMyFilesList] Returning subfolders:`, commonPrefixes);
  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(xml);
}

/**
 * Handle my-files/profile LIST request - return EPK subfolders
 * Profile Images, Profile Banners, Headshots, Press Shots
 */
function handleProfileList(res) {
  const commonPrefixes = PROFILE_SUBFOLDERS.map(f => `${VIRTUAL_PREFIX}/my-files/profile/${f}/`);
  const xml = generateListBucketXml(BUCKET, `${VIRTUAL_PREFIX}/my-files/profile/`, [], commonPrefixes);
  console.log(`[handleProfileList] Returning EPK folders:`, commonPrefixes);
  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(xml);
}

/**
 * Handle my-files/media LIST request - return social media subfolders
 * Photos, Videos
 */
function handleMediaList(res) {
  const commonPrefixes = MEDIA_SUBFOLDERS.map(f => `${VIRTUAL_PREFIX}/my-files/media/${f}/`);
  const xml = generateListBucketXml(BUCKET, `${VIRTUAL_PREFIX}/my-files/media/`, [], commonPrefixes);
  console.log(`[handleMediaList] Returning media folders:`, commonPrefixes);
  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(xml);
}

/**
 * Extract prefix from LIST request
 */
function extractListPrefix(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return url.searchParams.get('prefix') || '';
}

/**
 * Extract object path from request URL
 */
function extractObjectPath(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Path format: /bucket/path/to/object
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length === 0) return '';
  // First part is bucket, rest is path
  return pathParts.slice(1).join('/');
}

/**
 * Check if request is a LIST operation
 */
function isListRequest(req) {
  if (req.method !== 'GET') return false;
  const url = new URL(req.url, `http://${req.headers.host}`);
  // S3 LIST has list-type param or just bucket path
  return url.searchParams.has('list-type') ||
         url.searchParams.has('prefix') ||
         url.pathname.split('/').filter(Boolean).length <= 1;
}

/**
 * Forward request to Supabase Storage S3 with proper AWS signing
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {string} bucket - Target S3 bucket name
 * @param {string} objectPath - Object path within the bucket
 * @param {string} userId - User ID for path translation
 * @param {Array} orgs - User's organizations for path translation
 */
function forwardRequest(req, res, bucket, objectPath, userId, orgs) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Remove our custom params
  url.searchParams.delete('token');

  // Build final path with bucket and object path
  const finalPath = `${SUPABASE_S3_PATH}/${bucket}/${objectPath}${url.search}`;

  // Strip old AWS headers from Filestash
  const cleanHeaders = stripAwsHeaders(req.headers);

  // Handle CopyObject - translate x-amz-copy-source header
  const copySourceHeader = req.headers['x-amz-copy-source'];
  if (copySourceHeader) {
    try {
      // Source format: [/]bucket/path/to/file - need to extract and translate the virtual path
      // Filestash sends: media-library/my-files/profile/Profile Images/filename.png (no leading slash)
      const decodedSource = decodeURIComponent(copySourceHeader);
      // Remove optional leading slash and bucket name to get virtual path
      // Pattern matches: media-library/... or /media-library/...
      const sourcePath = decodedSource.replace(/^\/?[^/]+\//, '');

      console.log(`[CopyObject] Translating source: ${copySourceHeader} -> virtual: ${sourcePath}`);

      const translatedSource = translatePath(sourcePath, userId, orgs);
      if (translatedSource) {
        const newCopySource = `/${translatedSource.bucket}/${translatedSource.path}`;
        cleanHeaders['x-amz-copy-source'] = newCopySource;
        console.log(`[CopyObject] Translated copy-source: ${newCopySource}`);
      } else {
        console.error(`[CopyObject] translatePath returned null for: ${sourcePath}`);
      }
    } catch (err) {
      console.error(`[CopyObject] Failed to translate source: ${err.message}`);
      // Return error - don't proceed with bad copy source
      return sendError(res, 400, `Cannot translate copy source: ${err.message}`);
    }
  }

  // Collect body for PUT/POST operations (needed for signing)
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : null;

    // Sign the request with real Supabase S3 credentials
    const signedHeaders = signRequest(req.method, finalPath, cleanHeaders, body);

    console.log(`[forwardRequest] Signing request: ${req.method} ${finalPath} (bucket=${bucket}, path=${objectPath})`);

    const options = {
      hostname: SUPABASE_S3_HOST,
      port: 443,
      path: finalPath,
      method: req.method,
      headers: signedHeaders,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
    });

    // Send body if present
    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });

  req.on('error', (err) => {
    console.error('Request read error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Request error', message: err.message }));
  });
}

/**
 * Forward LIST request with translated prefix and proper AWS signing
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {string} bucket - Target S3 bucket name
 * @param {string} prefix - Path prefix within the bucket
 */
function forwardListRequest(req, res, bucket, prefix) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Update prefix parameter
  if (prefix) {
    url.searchParams.set('prefix', prefix);
  }

  const finalPath = `${SUPABASE_S3_PATH}/${bucket}${url.search}`;

  // Strip old AWS headers from Filestash
  const cleanHeaders = stripAwsHeaders(req.headers);

  // Sign the request with real Supabase S3 credentials
  const signedHeaders = signRequest('GET', finalPath, cleanHeaders, null);

  console.log(`[forwardListRequest] Signing request: GET ${finalPath} (bucket=${bucket}, prefix=${prefix})`);

  const options = {
    hostname: SUPABASE_S3_HOST,
    port: 443,
    path: finalPath,
    method: 'GET',
    headers: signedHeaders,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('List proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  proxyReq.end();
}

/**
 * Send JSON error response
 */
function sendError(res, status, message) {
  console.log(`[ERROR] ${status}: ${message}`);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/**
 * Main request handler
 */
const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();

  // DEBUG: Log ALL incoming requests
  console.log(`\n[${timestamp}] ===== INCOMING REQUEST =====`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log('=====================================\n');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-filestash-token, x-amz-*',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      bucket: BUCKET,
      cacheSize: orgCache.size
    }));
  }

  try {
    // Validate token (skip in dev mode)
    let userId, orgs;

    if (SKIP_AUTH) {
      console.log(`[${timestamp}] ${req.method} ${req.url} -> SKIP_AUTH enabled`);
      userId = 'dev-user';
      orgs = [{ id: 'dev-org', slug: 'dev-org' }];
    } else {
      const tokenResult = validateToken(req);
      if (!tokenResult.valid) {
        console.log(`[${timestamp}] AUTH FAILED: ${tokenResult.error}`);
        return sendError(res, 401, tokenResult.error);
      }

      userId = tokenResult.userId;
      orgs = await getUserOrgs(userId);
      console.log(`[${timestamp}] ${req.method} ${req.url} -> user=${userId}, orgs=${orgs.length}`);
    }

    // Handle LIST operations
    if (isListRequest(req)) {
      const prefix = extractListPrefix(req);
      const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');

      console.log(`[LIST] prefix="${prefix}", normalizedPrefix="${normalizedPrefix}"`);

      // Strip VIRTUAL_PREFIX from the request prefix to get the virtual path
      // Filestash sends: prefix="" for root, prefix="media-library/" for first level, etc.
      let virtualPath = normalizedPrefix;
      if (normalizedPrefix === VIRTUAL_PREFIX) {
        virtualPath = '';
      } else if (normalizedPrefix.startsWith(VIRTUAL_PREFIX + '/')) {
        virtualPath = normalizedPrefix.slice(VIRTUAL_PREFIX.length + 1);
      }

      console.log(`[LIST] virtualPath="${virtualPath}"`);

      // Root listing (no prefix, just "media-library", or empty virtualPath)
      if (!virtualPath) {
        return handleRootList(res, orgs);
      }

      // my-files listing
      if (virtualPath === 'my-files' || virtualPath === 'my-files/') {
        return handleMyFilesList(res);
      }

      // my-files/profile listing - show EPK subfolders
      if (virtualPath === 'my-files/profile' || virtualPath === 'my-files/profile/') {
        return handleProfileList(res);
      }

      // my-files/media listing - show social media subfolders
      if (virtualPath === 'my-files/media' || virtualPath === 'my-files/media/') {
        return handleMediaList(res);
      }

      // Translate prefix and forward to real storage
      try {
        const translated = translatePath(virtualPath, userId, orgs);
        if (translated) {
          console.log(`[LIST] Forwarding: virtualPath="${virtualPath}" -> bucket="${translated.bucket}", path="${translated.path}"`);
          return forwardListRequest(req, res, translated.bucket, translated.path + '/');
        }
      } catch (err) {
        return sendError(res, 403, err.message);
      }
    }

    // Handle object operations (GET, PUT, DELETE, HEAD)
    const objectPath = extractObjectPath(req);

    if (!objectPath) {
      return sendError(res, 400, 'No object path specified');
    }

    try {
      const translated = translatePath(objectPath, userId, orgs);
      if (!translated) {
        return sendError(res, 400, 'Cannot resolve path');
      }
      console.log(`[${timestamp}] Translated: ${objectPath} -> bucket="${translated.bucket}", path="${translated.path}"`);
      forwardRequest(req, res, translated.bucket, translated.path, userId, orgs);
    } catch (err) {
      return sendError(res, 403, err.message);
    }

  } catch (err) {
    console.error(`[${timestamp}] Unhandled error:`, err);
    sendError(res, 500, 'Internal server error');
  }
});

server.listen(PORT, () => {
  console.log(`S3 Auth Proxy (Virtual Folders) listening on http://localhost:${PORT}`);
  console.log(`Forwarding to: https://${SUPABASE_S3_HOST}${SUPABASE_S3_PATH}`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Auth: ${SKIP_AUTH ? 'DISABLED (dev mode)' : 'enabled'}`);
});
