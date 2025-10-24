# Multi-Profile System - Developer Quick Reference Guide

**Version:** 1.0
**Last Updated:** 2025-01-18
**For:** Developers working with the multi-profile switching system

## Quick Start

### Using the Profile Context

```typescript
import { useProfile } from '@/contexts/ProfileContext';

function MyComponent() {
  const {
    activeProfile,      // Current active profile: 'comedian' | 'promoter' | etc.
    availableProfiles,  // Array of user's profile types
    switchProfile,      // Function to switch profiles
    hasProfile,         // Check if user has specific profile
    isLoading,          // Loading state
    error              // Error state
  } = useProfile();

  // Check if user has a specific profile
  if (!hasProfile('comedian')) {
    return <div>You need a comedian profile</div>;
  }

  // Switch to a different profile
  const handleSwitch = () => {
    switchProfile('promoter');
  };

  return (
    <div>
      <p>Active: {activeProfile}</p>
      <button onClick={handleSwitch}>Switch to Promoter</button>
    </div>
  );
}
```

### Profile Types

```typescript
// Available profile types
type ProfileTypeValue =
  | 'comedian'
  | 'promoter'
  | 'manager'
  | 'photographer'
  | 'videographer';

// Profile type configuration
import { PROFILE_TYPES } from '@/contexts/ProfileContext';

const comedianConfig = PROFILE_TYPES.comedian;
// {
//   type: 'comedian',
//   label: 'Comedian Profile',
//   icon: Drama (Lucide icon component)
// }
```

### Checking Profile Completion

```typescript
import { useMultiProfileCompletion } from '@/hooks/useMultiProfileCompletion';

function ProfileCard({ profileType, profileData }) {
  const completion = useMultiProfileCompletion(profileType, profileData);

  return (
    <div>
      <div>Completion: {completion.percentage}%</div>
      <div>Status: {completion.label}</div>
      <div>Badge: {completion.variant}</div>

      {completion.missingFields.length > 0 && (
        <div>
          Missing: {completion.missingFields.join(', ')}
        </div>
      )}
    </div>
  );
}
```

## Database Queries

### Fetch User's Available Profiles

```typescript
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

// Map to profile types
const profiles = userRoles?.map(r => r.role) || [];
```

### Fetch Profile-Specific Data

```typescript
// For comedian/promoter (in base profiles table)
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// For manager
const { data: managerProfile } = await supabase
  .from('manager_profiles')
  .select('*')
  .eq('id', userId)
  .single();

// For photographer
const { data: photographerProfile } = await supabase
  .from('photographer_profiles')
  .select('*')
  .eq('id', userId)
  .single();

// For videographer
const { data: videographerProfile } = await supabase
  .from('videographer_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Create New Profile

```typescript
// 1. Add user role
const { error: roleError } = await supabase
  .from('user_roles')
  .upsert({
    user_id: userId,
    role: 'manager'
  }, {
    onConflict: 'user_id,role'
  });

// 2. Create profile-specific data
const { error: profileError } = await supabase
  .from('manager_profiles')
  .insert({
    id: userId,
    agency_name: 'My Agency',
    bio: 'Agency bio...'
  });
```

### Update Profile

```typescript
// Use upsert for manager/photographer/videographer
const { error } = await supabase
  .from('manager_profiles')
  .upsert({
    id: userId,
    agency_name: 'Updated Name',
    commission_rate: 15
  });

// For comedian/promoter, update profiles table
const { error } = await supabase
  .from('profiles')
  .update({
    name: 'Updated Name',
    bio: 'Updated bio'
  })
  .eq('id', userId);
```

### Delete Profile

```typescript
// 1. Delete profile-specific data
if (profileType === 'manager') {
  // Delete related data first
  await supabase
    .from('manager_comedian_relationships')
    .delete()
    .eq('manager_id', userId);

  // Then delete profile
  await supabase
    .from('manager_profiles')
    .delete()
    .eq('id', userId);
}

// 2. Delete user role
await supabase
  .from('user_roles')
  .delete()
  .eq('user_id', userId)
  .eq('role', profileType);
```

## Common Patterns

### Profile-Aware Component

```typescript
function MyFeature() {
  const { activeProfile } = useProfile();

  // Show different content based on active profile
  if (activeProfile === 'comedian') {
    return <ComedianView />;
  }

  if (activeProfile === 'promoter') {
    return <PromoterView />;
  }

  return <DefaultView />;
}
```

### Profile-Gated Feature

```typescript
function ManagerOnlyFeature() {
  const { activeProfile, hasProfile } = useProfile();

  if (!hasProfile('manager')) {
    return (
      <div>
        <p>This feature requires a manager profile</p>
        <button>Create Manager Profile</button>
      </div>
    );
  }

  if (activeProfile !== 'manager') {
    return (
      <div>
        <p>Please switch to your manager profile</p>
        <button onClick={() => switchProfile('manager')}>
          Switch to Manager
        </button>
      </div>
    );
  }

  return <ActualFeature />;
}
```

### Profile-Aware Data Fetching

```typescript
function useMyData() {
  const { activeProfile, isLoading: profileLoading } = useProfile();

  return useQuery({
    queryKey: ['my-data', activeProfile],
    queryFn: async () => {
      // Fetch data specific to active profile
      const { data } = await supabase
        .from('some_table')
        .select('*')
        .eq('profile_type', activeProfile);

      return data;
    },
    enabled: !profileLoading && !!activeProfile
  });
}
```

## Form Components

### Using Profile Forms

```typescript
import { ComedianProfileForm } from '@/components/profile/forms';

function MyComponent() {
  const handleSubmit = async (data: ComedianProfileFormData) => {
    // Save data to database
    await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);
  };

  return (
    <ComedianProfileForm
      initialData={existingData}
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancelled')}
      submitLabel="Save Changes"
    />
  );
}
```

### Available Form Components

- `ComedianProfileForm` - For comedian profiles
- `PromoterProfileForm` - For promoter profiles
- `ManagerProfileForm` - For manager profiles
- `PhotographerProfileForm` - For photographer profiles
- `VideographerProfileForm` - For videographer profiles

All forms export their data types:
```typescript
import type {
  ComedianProfileFormData,
  PromoterProfileFormData,
  ManagerProfileFormData,
  PhotographerProfileFormData,
  VideographerProfileFormData
} from '@/components/profile/forms';
```

## Routing

### Profile-Specific Routes

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Routes>
  {/* Comedian-only route */}
  <Route
    path="/comedian/gigs"
    element={
      <ProtectedRoute roles={['comedian']}>
        <MyGigsPage />
      </ProtectedRoute>
    }
  />

  {/* Manager-only route */}
  <Route
    path="/manager/clients"
    element={
      <ProtectedRoute roles={['manager']}>
        <ClientsPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

### Programmatic Navigation After Profile Switch

```typescript
import { useNavigate } from 'react-router-dom';

function MySwitcher() {
  const { switchProfile } = useProfile();
  const navigate = useNavigate();

  const handleSwitch = (newProfile: ProfileTypeValue) => {
    switchProfile(newProfile);

    // Navigate to profile-specific dashboard
    if (newProfile === 'manager') {
      navigate('/manager/dashboard');
    } else if (newProfile === 'comedian') {
      navigate('/dashboard');
    }
  };

  return <button onClick={() => handleSwitch('manager')}>Switch</button>;
}
```

## Testing

### Mocking Profile Context

```typescript
// In your test file
import { ProfileProvider } from '@/contexts/ProfileContext';

const mockProfileContext = {
  activeProfile: 'comedian',
  availableProfiles: ['comedian', 'promoter'],
  switchProfile: jest.fn(),
  hasProfile: jest.fn((type) => ['comedian', 'promoter'].includes(type)),
  isLoading: false,
  error: null
};

// Mock the useProfile hook
jest.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => mockProfileContext,
  PROFILE_TYPES: {
    comedian: { type: 'comedian', label: 'Comedian Profile', icon: jest.fn() },
    // ... other types
  }
}));
```

### Testing Profile Switching

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';

test('switches profile correctly', async () => {
  const { getByText } = render(<MyComponent />);

  const switchButton = getByText(/Switch to Promoter/i);
  fireEvent.click(switchButton);

  await waitFor(() => {
    expect(mockProfileContext.switchProfile).toHaveBeenCalledWith('promoter');
  });
});
```

## Best Practices

### 1. Always Check Profile Context Loading State

```typescript
const { activeProfile, isLoading } = useProfile();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!activeProfile) {
  return <NoProfilesMessage />;
}

// Proceed with profile-specific logic
```

### 2. Handle Profile Switching Gracefully

```typescript
// React to profile changes
useEffect(() => {
  // Refetch data when profile switches
  refetch();
}, [activeProfile]);
```

### 3. Validate Profile Access

```typescript
// Before showing profile-specific features
if (activeProfile === 'manager' && hasProfile('manager')) {
  // Safe to show manager features
}
```

### 4. Use Profile-Aware Query Keys

```typescript
// Include activeProfile in query keys for proper cache separation
useQuery({
  queryKey: ['bookings', activeProfile, userId],
  queryFn: fetchBookings
});
```

### 5. Handle Missing Profiles

```typescript
const { hasProfile } = useProfile();

if (!hasProfile('photographer')) {
  return (
    <EmptyState
      title="Photographer Profile Required"
      description="Create a photographer profile to access this feature"
      action={
        <Button onClick={openCreateProfileDialog}>
          Create Photographer Profile
        </Button>
      }
    />
  );
}
```

## Common Gotchas

### 1. Profile Data Tables

- Comedian and Promoter: Data in `profiles` table
- Manager, Photographer, Videographer: Separate tables
- Always check which table to query based on profile type

### 2. Profile Switching and State

- Profile switches update localStorage immediately
- Components should react to `activeProfile` changes via useEffect
- TanStack Query caches should be profile-aware (include activeProfile in keys)

### 3. Role vs Profile Type

- `user_roles.role` uses exact same values as ProfileTypeValue
- Role mapping: `'comedian'` → `'comedian'`, `'manager'` → `'manager'`, etc.
- No transformation needed

### 4. Specialties Arrays

- Photographer and Videographer profiles use `specialties: string[]`
- Empty array `[]` counts as incomplete
- At least one specialty required

### 5. Optional vs Required Fields

Each profile type has different required fields:
- **Comedian**: name, bio (required)
- **Promoter**: name (required)
- **Manager**: agency_name (required)
- **Photographer**: specialties (required, non-empty array)
- **Videographer**: specialties (required, non-empty array)

## Troubleshooting

### Profile Not Switching
```typescript
// Check localStorage
console.log(localStorage.getItem('active-profile-type'));

// Check available profiles
const { availableProfiles } = useProfile();
console.log('Available:', availableProfiles);

// Ensure profile exists
const { hasProfile } = useProfile();
console.log('Has manager:', hasProfile('manager'));
```

### Profile Data Not Loading
```typescript
// Verify user_roles entry exists
const { data } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);
console.log('User roles:', data);

// Check profile-specific table
const { data: profile } = await supabase
  .from('manager_profiles')
  .select('*')
  .eq('id', userId);
console.log('Manager profile:', profile);
```

### Completion Not Calculating
```typescript
// Check that profile data is passed correctly
const completion = useMultiProfileCompletion(profileType, profileData);
console.log('Profile data:', profileData);
console.log('Completion:', completion);
console.log('Missing:', completion.missingFields);
```

## Resources

- **Implementation Plan**: `/root/agents/docs/multi-profile-switching-plan.md`
- **Testing Guide**: `/root/agents/docs/MULTI_PROFILE_TESTING_GUIDE.md`
- **Implementation Summary**: `/root/agents/docs/MULTI_PROFILE_IMPLEMENTATION_COMPLETE.md`
- **ProfileContext**: `/root/agents/src/contexts/ProfileContext.tsx`
- **Forms**: `/root/agents/src/components/profile/forms/`
- **Tests**: `/root/agents/tests/`

## API Reference

### ProfileContext

```typescript
interface ProfileContextValue {
  activeProfile: ProfileTypeValue | null;
  availableProfiles: ProfileTypeValue[];
  switchProfile: (type: ProfileTypeValue) => void;
  isLoading: boolean;
  hasProfile: (type: ProfileTypeValue) => boolean;
  error: string | null;
}
```

### useMultiProfileCompletion

```typescript
interface CompletionResult {
  percentage: number;           // 0-100
  label: string;                // 'Empty' | 'Incomplete' | 'Nearly Complete' | 'Complete'
  variant: 'destructive' | 'default';
  missingFields: string[];      // Array of missing field names
}

function useMultiProfileCompletion(
  profileType: ProfileTypeValue,
  profileData: any
): CompletionResult;
```

### PROFILE_TYPES

```typescript
const PROFILE_TYPES: Record<ProfileTypeValue, ProfileType> = {
  comedian: {
    type: 'comedian',
    label: 'Comedian Profile',
    icon: Drama
  },
  promoter: {
    type: 'promoter',
    label: 'Promoter Profile',
    icon: Users
  },
  manager: {
    type: 'manager',
    label: 'Manager Profile',
    icon: Briefcase
  },
  photographer: {
    type: 'photographer',
    label: 'Photographer Profile',
    icon: Camera
  },
  videographer: {
    type: 'videographer',
    label: 'Videographer Profile',
    icon: Video
  }
};
```

---

**Happy Coding! 🎭**

For questions or issues, refer to the main documentation or create an issue in the repository.
