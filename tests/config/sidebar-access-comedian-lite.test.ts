import { describe, it, expect } from '@jest/globals';
import { MENU_ITEMS } from '@/config/sidebarMenuItems';

describe('comedian_lite sidebar access', () => {
  // comedian_lite has access to these items only
  const allowedItemIds = [
    'dashboard', 'gigs', 'profile', 'vouches', 'notifications',
    'settings', 'my-gigs', 'media-library', 'roadmap'
  ];

  // comedian_lite should NOT have access to these items
  const restrictedItemIds = [
    'shows', 'messages', 'social-media-manager', 'browse-comedians',
    'browse-photographers', 'applications', 'add-gig', 'tasks',
    'invoices', 'earnings', 'analytics', 'crm', 'users', 'web-app-settings'
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

    // comedian_lite has access to exactly 9 sidebar menu items
    // (dashboard, gigs, profile, vouches, notifications, settings, my-gigs, media-library, roadmap)
    expect(accessibleItems.length).toBe(9);
  });
});
