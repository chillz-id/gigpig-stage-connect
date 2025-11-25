import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MENU_ITEMS, type UserRole } from '@/config/sidebarMenuItems';

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  required?: boolean; // Items that cannot be hidden
}

/**
 * Get sidebar items available to the current user's role
 */
function getSidebarItemsForRole(role: UserRole | undefined): SidebarItem[] {
  if (!role) return [];

  return MENU_ITEMS
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      id: item.id,
      label: item.label,
      // Profile and Settings are required and cannot be hidden
      required: item.id === 'profile' || item.id === 'settings',
    }));
}

export function SidebarCustomization() {
  const { profile, roles } = useAuth();
  const { preferences, isItemHidden, getItemOrder, hideItem, showItem, setItemOrder } =
    useSidebarPreferences();
  const { toast } = useToast();

  // Get items available to the user's role(s)
  // Use the first role as the primary role for sidebar customization
  const userRole = roles[0]?.role as UserRole | undefined;

  // Memoize available items to prevent infinite loops
  const availableItems = useMemo(() => {
    return getSidebarItemsForRole(userRole);
  }, [userRole]);

  const [items, setItems] = useState<SidebarItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize items order from preferences
  useEffect(() => {
    if (availableItems.length === 0) {
      setItems([]);
      return;
    }

    const savedOrder = getItemOrder();
    if (savedOrder.length > 0) {
      const orderedItems = savedOrder
        .map((id) => availableItems.find((item) => item.id === id))
        .filter((item): item is SidebarItem => item !== undefined);

      // Add any new items not in saved order
      const remainingItems = availableItems.filter(
        (item) => !savedOrder.includes(item.id)
      );

      setItems([...orderedItems, ...remainingItems]);
    } else {
      setItems(availableItems);
    }
  }, [availableItems]); // Only depend on memoized availableItems

  const handleToggleVisibility = async (itemId: string, isRequired: boolean) => {
    if (isRequired) {
      toast({
        title: 'Cannot hide',
        description: 'This item is required and cannot be hidden',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isItemHidden(itemId)) {
        await showItem(itemId);
        toast({
          title: 'Item shown',
          description: 'Sidebar item is now visible',
        });
      } else {
        await hideItem(itemId);
        toast({
          title: 'Item hidden',
          description: 'Sidebar item is now hidden',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sidebar preferences',
        variant: 'destructive',
      });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);

    try {
      await setItemOrder(newItems.map((item) => item.id));
      toast({
        title: 'Order updated',
        description: 'Sidebar item order has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save sidebar order',
        variant: 'destructive',
      });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);

    try {
      await setItemOrder(newItems.map((item) => item.id));
      toast({
        title: 'Order updated',
        description: 'Sidebar item order has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save sidebar order',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      await setItemOrder(items.map((item) => item.id));
      toast({
        title: 'Order updated',
        description: 'Sidebar item order has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save sidebar order',
        variant: 'destructive',
      });
    }

    setDraggedIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Customization</CardTitle>
        <CardDescription>
          Hide, show, and reorder sidebar menu items to customize your navigation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="p-4 rounded-md bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              {userRole ? 'No sidebar items available for your role.' : 'Loading sidebar items...'}
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            {items.map((item, index) => {
            const hidden = isItemHidden(item.id);
            return (
              <div
                key={item.id}
                draggable={true}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3 rounded-md border cursor-move transition-all ${
                  hidden ? 'opacity-50 bg-muted' : 'bg-background'
                } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <Label htmlFor={`item-${item.id}`} className="text-sm font-medium">
                    {item.label}
                    {item.required && (
                      <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  {hidden ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    id={`item-${item.id}`}
                    checked={!hidden}
                    disabled={item.required}
                    onCheckedChange={() => handleToggleVisibility(item.id, item.required || false)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-md bg-muted">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Drag items using the grip icon to reorder them, or use the up/down arrows.
            Use the toggle to hide/show items in your sidebar navigation. Settings and Profile cannot be hidden.
          </p>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
