/**
 * Example token endpoint (Express-style) to issue Filestash session tokens.
 * Wire into your existing server; this file is illustrative only.
 */
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const SESSION_SECRET = process.env.FILESTASH_SESSION_SECRET || 'change-me';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Resolve scopes for user: profile slugs + org slugs with file_manager permission
async function resolveScopes(userId: string) {
  const scopes: string[] = [];

  // Profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('profile_slug, role')
    .eq('id', userId);
  (profiles || []).forEach((p) => {
    if (!p.profile_slug || !p.role) return;
    const role = p.role as string;
    // map role to path segment
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

  // Orgs with file_manager permission (simplified: owner)
  const { data: orgs } = await supabase
    .from('organization_profiles')
    .select('slug')
    .eq('owner_id', userId);
  (orgs || []).forEach((o) => {
    if (o.slug) scopes.push(`orgs/${o.slug}`);
  });

  return scopes;
}

export async function issueFilestashToken(req, res) {
  // TODO: replace with your auth; assume req.user.id exists
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const scopes = await resolveScopes(userId);
  if (!scopes.length) return res.status(403).json({ error: 'No scopes' });

  const token = jwt.sign(
    {
      sub: userId,
      scopes,
    },
    SESSION_SECRET,
    { expiresIn: '15m' }
  );

  return res.json({ token, expires_in: 900, scopes });
}
