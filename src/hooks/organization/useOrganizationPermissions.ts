import { useMemo, useContext } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  PermissionScope,
  PermissionAction,
  OrganizationPermissions,
  EffectivePermissions,
  PermissionCheckResult,
  OWNER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  MEMBER_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  ManagerType,
} from '@/types/permissions';

/**
 * Hook to check permissions for the current user in the active organization
 *
 * Safe to use outside OrganizationProvider - returns no permissions when not in org context.
 *
 * Usage:
 * ```tsx
 * const { hasPermission, canView, canEdit, canDelete, permissions } = useOrganizationPermissions();
 *
 * if (canEdit('financial')) {
 *   // Show edit button
 * }
 *
 * const result = hasPermission('events', 'delete');
 * if (!result.allowed) {
 *   console.log(result.reason);
 * }
 * ```
 */
export function useOrganizationPermissions() {
  // Try to get organization context, but don't throw if not available
  let organization, isOwner, isAdmin, isMember, isLoading;

  try {
    const orgContext = useOrganization();
    organization = orgContext.organization;
    isOwner = orgContext.isOwner;
    isAdmin = orgContext.isAdmin;
    isMember = orgContext.isMember;
    isLoading = orgContext.isLoading;
  } catch (error) {
    // Not in OrganizationProvider context - return safe defaults
    organization = undefined;
    isOwner = false;
    isAdmin = false;
    isMember = false;
    isLoading = false;
  }

  /**
   * Calculate effective permissions for the current user
   */
  const effectivePermissions = useMemo((): EffectivePermissions | null => {
    if (!organization || !isMember) {
      return null;
    }

    // Owner has full access
    if (isOwner) {
      return {
        permissions: OWNER_PERMISSIONS,
        isOwner: true,
        isAdmin: false,
        isManager: false,
        managerType: null,
        hasCustomPermissions: false,
      };
    }

    const memberRole = organization.member_role;
    const managerType = organization.manager_type as ManagerType | null;
    const customPermissions = organization.custom_permissions as OrganizationPermissions | null;

    // Admin has near-full access
    if (isAdmin) {
      return {
        permissions: customPermissions || ADMIN_PERMISSIONS,
        isOwner: false,
        isAdmin: true,
        isManager: false,
        managerType: null,
        hasCustomPermissions: !!customPermissions,
      };
    }

    // Manager with type - use default template or custom
    if (memberRole === 'manager') {
      let permissions: OrganizationPermissions;

      if (customPermissions) {
        // Custom permissions override template
        permissions = customPermissions;
      } else if (managerType && DEFAULT_PERMISSIONS[managerType]) {
        // Use manager type template
        permissions = DEFAULT_PERMISSIONS[managerType];
      } else {
        // Fallback to general manager template
        permissions = DEFAULT_PERMISSIONS.general;
      }

      return {
        permissions,
        isOwner: false,
        isAdmin: false,
        isManager: true,
        managerType: managerType || 'general',
        hasCustomPermissions: !!customPermissions,
      };
    }

    // Regular member - minimal permissions
    return {
      permissions: customPermissions || MEMBER_PERMISSIONS,
      isOwner: false,
      isAdmin: false,
      isManager: false,
      managerType: null,
      hasCustomPermissions: !!customPermissions,
    };
  }, [organization, isOwner, isAdmin, isMember]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (
    scope: PermissionScope,
    action: PermissionAction
  ): PermissionCheckResult => {
    if (!effectivePermissions) {
      return {
        allowed: false,
        reason: 'Not a member of this organization',
      };
    }

    const scopePermissions = effectivePermissions.permissions[scope];
    if (!scopePermissions) {
      return {
        allowed: false,
        reason: `Invalid permission scope: ${scope}`,
      };
    }

    const allowed = scopePermissions[action] === true;

    return {
      allowed,
      reason: allowed ? undefined : `Missing ${action} permission for ${scope}`,
    };
  };

  /**
   * Check if user can view a scope
   */
  const canView = (scope: PermissionScope): boolean => {
    return hasPermission(scope, 'view').allowed;
  };

  /**
   * Check if user can edit a scope
   */
  const canEdit = (scope: PermissionScope): boolean => {
    return hasPermission(scope, 'edit').allowed;
  };

  /**
   * Check if user can delete in a scope
   */
  const canDelete = (scope: PermissionScope): boolean => {
    return hasPermission(scope, 'delete').allowed;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (
    checks: Array<{ scope: PermissionScope; action: PermissionAction }>
  ): boolean => {
    return checks.some(({ scope, action }) => hasPermission(scope, action).allowed);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (
    checks: Array<{ scope: PermissionScope; action: PermissionAction }>
  ): boolean => {
    return checks.every(({ scope, action }) => hasPermission(scope, action).allowed);
  };

  /**
   * Get all scopes user can view
   */
  const viewableScopes = useMemo((): PermissionScope[] => {
    if (!effectivePermissions) return [];

    return (Object.entries(effectivePermissions.permissions) as Array<
      [PermissionScope, { view: boolean }]
    >)
      .filter(([_, perms]) => perms.view)
      .map(([scope]) => scope);
  }, [effectivePermissions]);

  /**
   * Get all scopes user can edit
   */
  const editableScopes = useMemo((): PermissionScope[] => {
    if (!effectivePermissions) return [];

    return (Object.entries(effectivePermissions.permissions) as Array<
      [PermissionScope, { edit: boolean }]
    >)
      .filter(([_, perms]) => perms.edit)
      .map(([scope]) => scope);
  }, [effectivePermissions]);

  return {
    // Core permission data
    effectivePermissions,
    permissions: effectivePermissions?.permissions || null,

    // Role checks
    isOwner: effectivePermissions?.isOwner || false,
    isAdmin: effectivePermissions?.isAdmin || false,
    isManager: effectivePermissions?.isManager || false,
    managerType: effectivePermissions?.managerType || null,
    hasCustomPermissions: effectivePermissions?.hasCustomPermissions || false,

    // Permission checking functions
    hasPermission,
    canView,
    canEdit,
    canDelete,
    hasAnyPermission,
    hasAllPermissions,

    // Convenience lists
    viewableScopes,
    editableScopes,

    // Membership status
    isMember,
  };
}

/**
 * Hook variant that throws error if user is not a member
 * Use this in pages that require organization membership
 */
export function useRequireOrganizationMembership() {
  const perms = useOrganizationPermissions();

  if (!perms.isMember) {
    throw new Error('User is not a member of this organization');
  }

  return perms;
}

/**
 * Hook variant that requires specific permission
 * Throws error if permission is not granted
 */
export function useRequirePermission(scope: PermissionScope, action: PermissionAction) {
  const perms = useOrganizationPermissions();

  const result = perms.hasPermission(scope, action);

  if (!result.allowed) {
    throw new Error(result.reason || `Missing ${action} permission for ${scope}`);
  }

  return perms;
}
