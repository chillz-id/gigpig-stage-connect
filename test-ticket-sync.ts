/**
 * Test script for ticket sync functionality
 * Tests the external API integrations without making actual API calls
 */

import { ticketSyncService } from './src/services/ticketSyncService';
import { humanitixApiService } from './src/services/humanitixApiService';
import { eventbriteApiService } from './src/services/eventbriteApiService';

// Mock API responses for testing
const mockHumanitixEvent = {
  id: 'humanitix-event-123',
  name: 'Test Comedy Show',
  capacity: 200,
  tickets_sold: 150,
  gross_revenue: 3000,
  url: 'https://humanitix.com/events/test-comedy-show',
  status: 'live' as const,
  start_date: '2024-02-15T19:00:00Z',
  end_date: '2024-02-15T22:00:00Z',
  venue: {
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia'
  },
  description: 'Test comedy show for sync testing',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T10:00:00Z'
};

const mockHumanitixOrders = [
  {
    id: 'order-123',
    event_id: 'humanitix-event-123',
    customer: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+61400000000'
    },
    tickets: [
      {
        ticket_type_id: 'general-admission',
        ticket_type_name: 'General Admission',
        quantity: 2,
        price: 25,
        total: 50
      }
    ],
    total_amount: 50,
    fees: 5,
    net_amount: 45,
    status: 'paid' as const,
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z'
  }
];

const mockEventbriteEvent = {
  id: 'eventbrite-event-456',
  name: {
    text: 'Test Comedy Show',
    html: 'Test Comedy Show'
  },
  description: {
    text: 'Test comedy show for sync testing',
    html: 'Test comedy show for sync testing'
  },
  start: {
    timezone: 'Australia/Sydney',
    local: '2024-02-15T19:00:00',
    utc: '2024-02-15T08:00:00Z'
  },
  end: {
    timezone: 'Australia/Sydney',
    local: '2024-02-15T22:00:00',
    utc: '2024-02-15T11:00:00Z'
  },
  venue_id: 'venue-789',
  capacity: 200,
  status: 'live' as const,
  currency: 'AUD',
  url: 'https://eventbrite.com/e/test-comedy-show',
  created: '2024-01-15T10:00:00Z',
  changed: '2024-01-20T10:00:00Z',
  published: '2024-01-18T10:00:00Z',
  resource_uri: 'https://www.eventbriteapi.com/v3/events/eventbrite-event-456/'
};

const mockEventbriteOrders = [
  {
    id: 'eb-order-789',
    event_id: 'eventbrite-event-456',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    status: 'placed' as const,
    time_remaining: 0,
    created: '2024-01-17T16:45:00Z',
    changed: '2024-01-17T16:45:00Z',
    costs: {
      base_price: {
        currency: 'AUD',
        value: 25,
        display: '$25.00'
      },
      eventbrite_fee: {
        currency: 'AUD',
        value: 2.5,
        display: '$2.50'
      },
      gross: {
        currency: 'AUD',
        value: 27.5,
        display: '$27.50'
      },
      tax: {
        currency: 'AUD',
        value: 2.5,
        display: '$2.50'
      }
    },
    attendees: [
      {
        id: 'attendee-123',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        status: 'Attending' as const,
        ticket_class_id: 'general-admission',
        ticket_class_name: 'General Admission'
      }
    ],
    resource_uri: 'https://www.eventbriteapi.com/v3/orders/eb-order-789/'
  }
];

// Mock fetch function for testing
const originalFetch = global.fetch;
global.fetch = jest.fn((url: string) => {
  if (url.includes('humanitix.com/v1/events/')) {
    if (url.includes('/orders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ orders: mockHumanitixOrders })
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHumanitixEvent)
    } as Response);
  }
  
  if (url.includes('eventbriteapi.com/v3/events/')) {
    if (url.includes('/orders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ orders: mockEventbriteOrders })
      } as Response);
    }
    if (url.includes('/ticket_classes')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          ticket_classes: [
            {
              id: 'general-admission',
              name: 'General Admission',
              cost: { currency: 'AUD', value: 25, display: '$25.00' },
              quantity_total: 200,
              quantity_sold: 150,
              on_sale_status: 'AVAILABLE'
            }
          ]
        })
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockEventbriteEvent)
    } as Response);
  }
  
  return Promise.reject(new Error(`Unmocked URL: ${url}`));
});

// Mock Supabase client
jest.mock('./src/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null })
  }
}));

// Test functions
async function testTicketSyncService() {
  console.log('=== Testing Ticket Sync Service ===');
  
  try {
    const testEventId = 'test-event-123';
    
    // Test sync status
    console.log('1. Testing sync status...');
    const syncStatus = await ticketSyncService.getSyncStatus(testEventId);
    console.log('Sync status:', syncStatus);
    
    // Test adding platforms
    console.log('2. Testing add platform...');
    await ticketSyncService.addPlatform(
      testEventId,
      'humanitix',
      'humanitix-event-123',
      'https://humanitix.com/events/test-comedy-show',
      true
    );
    console.log('Added Humanitix platform');
    
    await ticketSyncService.addPlatform(
      testEventId,
      'eventbrite',
      'eventbrite-event-456',
      'https://eventbrite.com/e/test-comedy-show',
      false
    );
    console.log('Added Eventbrite platform');
    
    // Test sync all platforms
    console.log('3. Testing sync all platforms...');
    const syncResults = await ticketSyncService.syncAllPlatforms(testEventId);
    console.log('Sync results:', syncResults);
    
    console.log('✅ Ticket Sync Service tests passed!');
    
  } catch (error) {
    console.error('❌ Ticket Sync Service test failed:', error);
    throw error;
  }
}

async function testHumanitixApiService() {
  console.log('=== Testing Humanitix API Service ===');
  
  try {
    const testEventId = 'test-event-123';
    const humanitixEventId = 'humanitix-event-123';
    
    // Test sync event
    console.log('1. Testing sync event...');
    await humanitixApiService.syncEventTicketSales(testEventId, humanitixEventId);
    console.log('Sync completed successfully');
    
    // Test webhook handling
    console.log('2. Testing webhook handling...');
    const webhookPayload = {
      event_type: 'order.created' as const,
      data: {
        order: mockHumanitixOrders[0],
        event: mockHumanitixEvent
      },
      timestamp: new Date().toISOString()
    };
    
    await humanitixApiService.handleWebhook(webhookPayload);
    console.log('Webhook handled successfully');
    
    console.log('✅ Humanitix API Service tests passed!');
    
  } catch (error) {
    console.error('❌ Humanitix API Service test failed:', error);
    throw error;
  }
}

async function testEventbriteApiService() {
  console.log('=== Testing Eventbrite API Service ===');
  
  try {
    const testEventId = 'test-event-123';
    const eventbriteEventId = 'eventbrite-event-456';
    
    // Test sync event
    console.log('1. Testing sync event...');
    await eventbriteApiService.syncEventTicketSales(testEventId, eventbriteEventId);
    console.log('Sync completed successfully');
    
    // Test webhook handling
    console.log('2. Testing webhook handling...');
    const webhookPayload = {
      config: {
        user_id: 'test-user',
        action: 'order.placed',
        webhook_id: 'webhook-123',
        endpoint_url: 'https://example.com/webhook'
      },
      api_url: 'https://www.eventbriteapi.com/v3/events/eventbrite-event-456/orders/eb-order-789/'
    };
    
    await eventbriteApiService.handleWebhook(webhookPayload);
    console.log('Webhook handled successfully');
    
    console.log('✅ Eventbrite API Service tests passed!');
    
  } catch (error) {
    console.error('❌ Eventbrite API Service test failed:', error);
    throw error;
  }
}

async function testWebhookHandling() {
  console.log('=== Testing Webhook Handling ===');
  
  try {
    // Test Humanitix webhook
    console.log('1. Testing Humanitix webhook...');
    const humanitixWebhook = {
      platform: 'humanitix' as const,
      eventType: 'order.created',
      payload: {
        event_type: 'order.created',
        data: {
          order: mockHumanitixOrders[0],
          event: mockHumanitixEvent
        },
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    await ticketSyncService.handleWebhook(humanitixWebhook);
    console.log('Humanitix webhook handled successfully');
    
    // Test Eventbrite webhook
    console.log('2. Testing Eventbrite webhook...');
    const eventbriteWebhook = {
      platform: 'eventbrite' as const,
      eventType: 'order.placed',
      payload: {
        config: {
          user_id: 'test-user',
          action: 'order.placed',
          webhook_id: 'webhook-123',
          endpoint_url: 'https://example.com/webhook'
        },
        api_url: 'https://www.eventbriteapi.com/v3/events/eventbrite-event-456/orders/eb-order-789/'
      },
      timestamp: new Date().toISOString()
    };
    
    await ticketSyncService.handleWebhook(eventbriteWebhook);
    console.log('Eventbrite webhook handled successfully');
    
    console.log('✅ Webhook handling tests passed!');
    
  } catch (error) {
    console.error('❌ Webhook handling test failed:', error);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Ticket Sync Integration Tests...\n');
  
  try {
    await testHumanitixApiService();
    console.log('');
    
    await testEventbriteApiService();
    console.log('');
    
    await testTicketSyncService();
    console.log('');
    
    await testWebhookHandling();
    console.log('');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}

// Export for external use
export {
  testTicketSyncService,
  testHumanitixApiService,
  testEventbriteApiService,
  testWebhookHandling,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}