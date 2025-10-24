import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface CreateStorageStateOptions {
  email: string;
  password: string;
  storageStatePath: string;
  baseURL: string;
}

const REQUIRED_AUTH_ENV = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

const missingAuthEnv = REQUIRED_AUTH_ENV.filter((key) => !process.env[key]);
if (missingAuthEnv.length > 0) {
  throw new Error(
    `Missing required Supabase environment variables for Playwright storage state: ${missingAuthEnv.join(
      ', '
    )}`
  );
}

const supabasePublic = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ensureDirectory = async (targetFile: string) => {
  const directory = path.dirname(targetFile);
  await fs.mkdir(directory, { recursive: true });
};

const resolveProjectRef = (supabaseUrl: string) => {
  const hostname = new URL(supabaseUrl).hostname;
  const [projectRef] = hostname.split('.');
  if (!projectRef) {
    throw new Error(`Unable to determine Supabase project reference from URL: ${supabaseUrl}`);
  }
  return projectRef;
};

export const createCrmStorageState = async ({
  email,
  password,
  storageStatePath,
  baseURL,
}: CreateStorageStateOptions) => {
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(
      `Failed to sign in Supabase user "${email}" for Playwright storage state: ${error?.message ?? 'No session returned'}`
    );
  }

  const session = data.session;
  const projectRef = resolveProjectRef(process.env.SUPABASE_URL!);

  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in;

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: `sb-${projectRef}-auth-token`,
            value: JSON.stringify({
              currentSession: session,
              currentUser: session.user,
              expires_at: expiresAt,
              expires_in: session.expires_in,
              refresh_token: session.refresh_token,
              access_token: session.access_token,
              token_type: session.token_type,
            }),
          },
        ],
      },
    ],
  };

  await ensureDirectory(storageStatePath);
  await fs.writeFile(storageStatePath, JSON.stringify(storageState, null, 2), 'utf-8');
};

export const resolveStorageStatePath = (relativePath: string) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, relativePath);
};

