/**
 * S3 Auth Proxy for Filestash → Supabase Storage
 *
 * This proxy:
 * 1. Accepts S3 requests from Filestash
 * 2. Validates the JWT token (from x-filestash-token header or query param)
 * 3. Enforces path-based scopes from the token
 * 4. Forwards valid requests to Supabase Storage S3 endpoint
 *
 * Environment:
 * - SUPABASE_PROJECT_REF (e.g., pdikjpfulhhpqpxzpgtu)
 * - SUPABASE_S3_ACCESS_KEY
 * - SUPABASE_S3_SECRET_KEY
 * - SUPABASE_STORAGE_BUCKET (default: media-library)
 * - FILESTASH_SESSION_SECRET
 * - PORT (default: 9000)
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import jwt from 'jsonwebtoken';

const PORT = process.env.PORT || 9000;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const S3_ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.SUPABASE_S3_SECRET_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media-library';
const SESSION_SECRET = process.env.FILESTASH_SESSION_SECRET || 'change-me';
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'; // Dev mode: bypass JWT validation

// Supabase Storage S3 endpoint
const SUPABASE_S3_HOST = `${PROJECT_REF}.supabase.co`;
const SUPABASE_S3_PATH = '/storage/v1/s3';

if (!PROJECT_REF || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
  console.error('Missing required environment variables:');
  console.error('- SUPABASE_PROJECT_REF');
  console.error('- SUPABASE_S3_ACCESS_KEY');
  console.error('- SUPABASE_S3_SECRET_KEY');
  process.exit(1);
}

/**
 * Extract and validate JWT token from request
 */
function validateToken(req) {
  // Try header first, then query param
  let token = req.headers['x-filestash-token'];

  if (!token) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    token = url.searchParams.get('token');
  }

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `Invalid token: ${err.message}` };
  }
}

/**
 * Extract the object path from S3 request
 */
function extractPath(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // S3 path style: /bucket/path/to/object
  // We need to extract the path after the bucket name
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    return null; // Bucket list operation
  }

  // First part is bucket, rest is the path
  const bucket = pathParts[0];
  const objectPath = pathParts.slice(1).join('/');

  return { bucket, objectPath, fullPath: url.pathname };
}

/**
 * Check if the requested path is within allowed scopes
 */
function checkScope(scopes, objectPath) {
  if (!objectPath) return true; // Bucket-level operations allowed if user has any scope

  const normalized = objectPath.replace(/^\/+/, '');
  return scopes.some(scope => normalized.startsWith(scope));
}

/**
 * Forward request to Supabase Storage S3
 */
function forwardRequest(req, res, originalUrl) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Remove our custom params
  url.searchParams.delete('token');

  const options = {
    hostname: SUPABASE_S3_HOST,
    port: 443,
    path: `${SUPABASE_S3_PATH}${url.pathname}${url.search}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: SUPABASE_S3_HOST,
      // Remove our custom headers
      'x-filestash-token': undefined,
    },
  };

  // Remove undefined headers
  Object.keys(options.headers).forEach(key => {
    if (options.headers[key] === undefined) {
      delete options.headers[key];
    }
  });

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  req.pipe(proxyReq);
}

/**
 * Send JSON error response
 */
function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/**
 * Main request handler
 */
const server = http.createServer((req, res) => {
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
    return res.end(JSON.stringify({ status: 'ok', bucket: BUCKET }));
  }

  // Validate token (skip in dev mode)
  if (SKIP_AUTH) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> SKIP_AUTH enabled`);
  } else {
    const tokenResult = validateToken(req);
    if (!tokenResult.valid) {
      console.log(`[${new Date().toISOString()}] AUTH FAILED: ${tokenResult.error}`);
      return sendError(res, 401, tokenResult.error);
    }

    const { payload } = tokenResult;
    const scopes = payload.scopes || [];

    // Extract and validate path
    const pathInfo = extractPath(req);

    if (pathInfo && !checkScope(scopes, pathInfo.objectPath)) {
      console.log(`[${new Date().toISOString()}] FORBIDDEN: ${pathInfo.objectPath} not in scopes ${scopes.join(', ')}`);
      return sendError(res, 403, 'Access denied: path outside allowed scopes');
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> user=${payload.sub}`);
  }

  // Forward to Supabase
  forwardRequest(req, res, req.url);
});

server.listen(PORT, () => {
  console.log(`S3 Auth Proxy listening on http://localhost:${PORT}`);
  console.log(`Forwarding to: https://${SUPABASE_S3_HOST}${SUPABASE_S3_PATH}`);
  console.log(`Bucket: ${BUCKET}`);
});
