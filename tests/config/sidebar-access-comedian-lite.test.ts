import { describe, it, expect } from '@jest/globals';
import { MENU_ITEMS } from '@/config/sidebarMenuItems';

describe('comedian_lite sidebar access', () => {
  const allowedItemIds = [
    'dashboard', 'gigs', 'my-gigs', 'add-gig', 'calendar',
    'profile', 'vouches', 'settings',
    'applications', 'media-library'
    // Note: roadmap will be added in Task 10, notifications doesn't exist as standalone
  ];

  const restrictedItemIds = [
    'shows', 'messages', 'browse-comedians', 'browse-photographers', 'tasks', 'invoices',
    'earnings', 'analytics', 'crm', 'users', 'web-app-settings', 'social-media-manager'
  ];

  it('should include comedian_lite in all allowed items', () => {
    // Recursively find all menu items including nested ones
    const getAllMenuItems = (items: typeof MENU_ITEMS): typeof MENU_ITEMS => {
      const result: typeof MENU_ITEMS = [];
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          result.push(...getAllMenuItems(item.children));
        }
      });
      return result;
    };

    const allItems = getAllMenuItems(MENU_ITEMS);
    const accessibleItems = allItems.filter(item =>
      item.roles?.includes('comedian_lite')
    );

    const accessibleIds = accessibleItems.map(item => item.id);

    allowedItemIds.forEach(id => {
      expect(accessibleIds).toContain(id);
    });
  });

  it('should exclude comedian_lite from restricted items', () => {
    const getAllMenuItems = (items: typeof MENU_ITEMS): typeof MENU_ITEMS => {
      const result: typeof MENU_ITEMS = [];
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          result.push(...getAllMenuItems(item.children));
        }
      });
      return result;
    };

    const allItems = getAllMenuItems(MENU_ITEMS);
    const restrictedItems = allItems.filter(item =>
      restrictedItemIds.includes(item.id)
    );

    restrictedItems.forEach(item => {
      expect(item.roles?.includes('comedian_lite')).toBe(false);
    });
  });

  it('should have expected accessible items for comedian_lite', () => {
    const getAllMenuItems = (items: typeof MENU_ITEMS): typeof MENU_ITEMS => {
      const result: typeof MENU_ITEMS = [];
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          result.push(...getAllMenuItems(item.children));
        }
      });
      return result;
    };

    const allItems = getAllMenuItems(MENU_ITEMS);
    const accessibleItems = allItems.filter(item =>
      item.roles?.includes('comedian_lite')
    );

    // Updated: 12 items after adding Calendar page (Task 17)
    // Will be 13 after roadmap added in Task 10
    expect(accessibleItems.length).toBe(12);
  });
});
