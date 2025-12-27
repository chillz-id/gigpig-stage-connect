/**
 * Filestash backend driver (Supabase Storage)
 *
 * NOTE: This is a scaffold; wire it into Filestash's custom backend interface.
 * Expected env:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_STORAGE_BUCKET (default: media-library)
 *
 * Scope enforcement: call `validateScope` with the user token to ensure the requested path
 * stays within allowed prefixes (profiles/orgs). Integrate this with your auth gateway.
 */

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import streamToBuffer from 'stream-to-buffer';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media-library';
const SESSION_SECRET = process.env.FILESTASH_SESSION_SECRET || 'change-me';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Validate that the requested path is within the allowed scope.
 * Token payload example:
 * {
 *   scopes: ["profiles/comedian/anthony-skinner", "orgs/id-comedy"],
 *   exp: <unix_ts>
 * }
 */
function validateScope(token, path) {
  const payload = jwt.verify(token, SESSION_SECRET);
  const normalized = path.replace(/^\/+/, '');
  const allowed = payload.scopes || [];
  const ok = allowed.some((prefix) => normalized.startsWith(prefix));
  if (!ok) {
    const err = new Error('Forbidden path');
    err.code = 'FORBIDDEN';
    throw err;
  }
}

async function list(path, token) {
  validateScope(token, path);
  const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit: 100, offset: 0 });
  if (error) throw error;
  return data || [];
}

async function read(path, token) {
  validateScope(token, path);
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return data; // Blob/stream
}

async function write(path, stream, token) {
  validateScope(token, path);
  const buffer = await new Promise((resolve, reject) => {
    streamToBuffer(stream, (err, buf) => (err ? reject(err) : resolve(buf)));
  });
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { upsert: true });
  if (error) throw error;
}

async function remove(path, token) {
  validateScope(token, path);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export default { list, read, write, remove };
