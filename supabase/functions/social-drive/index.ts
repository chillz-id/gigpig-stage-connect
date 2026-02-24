import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/drive';

// ─── JWT / Auth Helpers ─────────────────────────────────────────────────────

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToDer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  const email = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

  if (!email || !privateKey) {
    throw new Error('Google service account not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY secrets.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(privateKey);
  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(new Uint8Array(sig))}`;

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  const data = await resp.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
  return data.access_token;
}

// ─── Drive API Helpers ──────────────────────────────────────────────────────

async function driveGet(path: string, token: string, params?: Record<string, string>) {
  const url = new URL(`${DRIVE_API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API ${path} failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

async function drivePatch(path: string, token: string, body: unknown) {
  const resp = await fetch(`${DRIVE_API}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API PATCH ${path} failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

async function drivePost(path: string, token: string, body: unknown) {
  const resp = await fetch(`${DRIVE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API POST ${path} failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

// Navigate a folder path like "iD Comedy Club/Ready to Post/Reels" to get folder ID
async function resolveFolderPath(rootId: string, pathParts: string[], token: string): Promise<string> {
  let currentId = rootId;
  for (const part of pathParts) {
    const data = await driveGet('/files', token, {
      q: `'${currentId}' in parents and name = '${part.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: '1',
    });
    if (!data.files || data.files.length === 0) {
      throw new Error(`Folder not found: ${part} (in path: ${pathParts.join('/')})`);
    }
    currentId = data.files[0].id;
  }
  return currentId;
}

// List media files in a folder (images + videos)
async function listMediaFiles(
  folderId: string,
  token: string,
  pageToken?: string,
): Promise<{ files: unknown[]; nextPageToken?: string }> {
  const mimeFilter = [
    "mimeType contains 'video/'",
    "mimeType contains 'image/'",
  ].join(' or ');

  const data = await driveGet('/files', token, {
    q: `'${folderId}' in parents and (${mimeFilter}) and trashed = false`,
    fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,webContentLink,videoMediaMetadata,imageMediaMetadata,parents)',
    pageSize: '100',
    orderBy: 'createdTime desc',
    ...(pageToken ? { pageToken } : {}),
  });

  return { files: data.files ?? [], nextPageToken: data.nextPageToken };
}

// Create a shareable link for a file (anyone with link can view)
async function createShareLink(fileId: string, token: string): Promise<string> {
  // Create permission
  await drivePost(`/files/${fileId}/permissions`, token, {
    role: 'reader',
    type: 'anyone',
  });
  // Get the webViewLink
  const file = await driveGet(`/files/${fileId}`, token, {
    fields: 'webViewLink,webContentLink',
  });
  return file.webContentLink ?? file.webViewLink;
}

// Move file to a new folder (remove from old parent, add to new)
async function moveFile(fileId: string, destFolderId: string, token: string): Promise<unknown> {
  // Get current parents
  const file = await driveGet(`/files/${fileId}`, token, { fields: 'parents' });
  const previousParents = (file.parents ?? []).join(',');

  return drivePatch(`/files/${fileId}?addParents=${destFolderId}&removeParents=${previousParents}`, token, {});
}

// Scan all "Ready to Post" subfolders for a brand
async function scanBrandMedia(
  rootId: string,
  brand: string,
  token: string,
): Promise<{ files: unknown[]; folderPath: string }[]> {
  const results: { files: unknown[]; folderPath: string }[] = [];

  // Navigate to brand's "Ready to Post" folder
  let readyFolderId: string;
  try {
    readyFolderId = await resolveFolderPath(rootId, [brand, 'Ready to Post'], token);
  } catch {
    return results; // Brand or folder doesn't exist yet
  }

  // List subfolders (Reels, Stories, etc.)
  const subfolders = await driveGet('/files', token, {
    q: `'${readyFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name)',
  });

  for (const folder of subfolders.files ?? []) {
    const { files } = await listMediaFiles(folder.id, token);
    if (files.length > 0) {
      results.push({
        files,
        folderPath: `${brand}/Ready to Post/${folder.name}`,
      });
    }
  }

  // Also check root of Ready to Post
  const { files: rootFiles } = await listMediaFiles(readyFolderId, token);
  if (rootFiles.length > 0) {
    results.push({
      files: rootFiles,
      folderPath: `${brand}/Ready to Post`,
    });
  }

  return results;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify Supabase auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
    if (!rootFolderId) {
      return new Response(
        JSON.stringify({ error: 'Google Drive not configured. Set GOOGLE_DRIVE_ROOT_FOLDER_ID secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const { action, folderId, folderPath, fileId, destinationFolderId, brand, pageToken } = body;

    const token = await getAccessToken();
    let result: unknown;

    switch (action) {
      case 'list': {
        if (!folderId && !folderPath) {
          return new Response(
            JSON.stringify({ error: 'folderId or folderPath required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        const targetId = folderId ?? await resolveFolderPath(rootFolderId, folderPath.split('/'), token);
        result = await listMediaFiles(targetId, token, pageToken);
        break;
      }

      case 'get': {
        if (!fileId) {
          return new Response(
            JSON.stringify({ error: 'fileId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        result = await driveGet(`/files/${fileId}`, token, {
          fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,webContentLink,videoMediaMetadata,imageMediaMetadata,parents',
        });
        break;
      }

      case 'share': {
        if (!fileId) {
          return new Response(
            JSON.stringify({ error: 'fileId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        const shareUrl = await createShareLink(fileId, token);
        result = { url: shareUrl };
        break;
      }

      case 'move': {
        if (!fileId || !destinationFolderId) {
          return new Response(
            JSON.stringify({ error: 'fileId and destinationFolderId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        result = await moveFile(fileId, destinationFolderId, token);
        break;
      }

      case 'scan': {
        if (!brand) {
          return new Response(
            JSON.stringify({ error: 'brand required for scan' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        result = await scanBrandMedia(rootFolderId, brand, token);
        break;
      }

      case 'resolve-path': {
        if (!folderPath) {
          return new Response(
            JSON.stringify({ error: 'folderPath required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        const resolvedId = await resolveFolderPath(rootFolderId, folderPath.split('/'), token);
        result = { folderId: resolvedId };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    return new Response(
      JSON.stringify({ ok: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Social Drive proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
