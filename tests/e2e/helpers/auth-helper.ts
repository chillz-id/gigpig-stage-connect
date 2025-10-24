import { promises as fs } from 'fs';
import path from 'path';

import { createCrmStorageState } from '../setup/create-storage-state';
import { TEST_ACCOUNTS, TestAccount } from '../setup/seed-test-accounts';

const ensureAuthDirectory = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

export async function loginAllTestAccounts(
  baseURL: string = 'http://localhost:8083',
  authDir: string = 'tests/e2e/.auth'
): Promise<void> {
  console.log('🔑 Generating storage state for CRM test accounts...');

  await ensureAuthDirectory(authDir);

  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    const storageStatePath = path.join(authDir, `${role}.json`);
    console.log(`  🔐 Creating session for ${account.email} -> ${storageStatePath}`);
    await createCrmStorageState({
      email: account.email,
      password: account.password,
      storageStatePath,
      baseURL,
    });
  }

  console.log('✅ Storage states generated for all CRM test accounts');
}

/**
 * Get test account by role
 *
 * @param role - User role (admin, manager, promoter, venue)
 */
export function getTestAccount(role: 'admin' | 'manager' | 'promoter' | 'venue'): TestAccount {
  return TEST_ACCOUNTS[role];
}

/**
 * Get storage path for a role
 *
 * @param role - User role
 * @param authDir - Auth directory path
 */
export function getStoragePath(
  role: 'admin' | 'manager' | 'promoter' | 'venue',
  authDir: string = 'tests/e2e/.auth'
): string {
  return `${authDir}/${role}.json`;
}
