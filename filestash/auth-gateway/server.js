// Minimal auth gateway to issue Filestash session tokens.
// Run: FILESTASH_SESSION_SECRET=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server.js
// Exposes POST /filestash/token
// Requires Authorization: Bearer <app access token> (Supabase JWT)

import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const PORT = process.env.PORT || 8335;
const SESSION_SECRET = process.env.FILESTASH_SESSION_SECRET || 'change-me';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

async function resolveScopes(userId) {
  const scopes = [];

  // Profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('profile_slug, role')
    .eq('id', userId);
  if (profilesError) {
    console.error('profilesError', profilesError);
  }
  (profiles || []).forEach((p) => {
    if (!p.profile_slug || !p.role) return;
    const role = p.role;
    const type =
      role === 'comedian' || role === 'comedian_lite'
        ? 'comedian'
        : role === 'manager'
        ? 'manager'
        : role === 'photographer'
        ? 'photographer'
        : role === 'venue'
        ? 'venue'
        : null;
    if (type) scopes.push(`profiles/${type}/${p.profile_slug}`);
  });

  // Orgs (owner) – extend with permissions as needed
  const { data: orgs, error: orgsError } = await supabase
    .from('organization_profiles')
    .select('slug')
    .eq('owner_id', userId);
  if (orgsError) {
    console.error('orgsError', orgsError);
  }
  (orgs || []).forEach((o) => {
    if (o.slug) scopes.push(`orgs/${o.slug}`);
  });

  return scopes;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/filestash/token') {
    res.statusCode = 404;
    return res.end();
  }

  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json(res, 401, { error: 'Missing Authorization bearer token' });

  // Validate user token via Supabase
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    console.error('userError', userError);
    return json(res, 401, { error: 'Invalid user token' });
  }

  const userId = userData.user.id;
  const scopes = await resolveScopes(userId);
  if (!scopes.length) return json(res, 403, { error: 'No storage scopes for user' });

  const filestashToken = jwt.sign({ sub: userId, scopes }, SESSION_SECRET, { expiresIn: '15m' });
  return json(res, 200, { token: filestashToken, expires_in: 900, scopes });
});

server.listen(PORT, () => {
  console.log(`Filestash auth gateway running on http://localhost:${PORT}/filestash/token`);
});
