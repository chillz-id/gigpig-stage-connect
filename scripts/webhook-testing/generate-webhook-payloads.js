#!/usr/bin/env node

/**
 * Webhook Payload Generator
 * Generates realistic test payloads for different webhook scenarios
 */

import crypto from 'crypto';

class WebhookPayloadGenerator {
  constructor() {
    this.eventIds = new Set();
    this.orderIds = new Set();
  }

  generateId(prefix = '') {
    return prefix + crypto.randomBytes(8).toString('hex');
  }

  generateUniqueEventId() {
    let id;
    do {
      id = this.generateId('evt_');
    } while (this.eventIds.has(id));
    this.eventIds.add(id);
    return id;
  }

  generateUniqueOrderId() {
    let id;
    do {
      id = this.generateId('ord_');
    } while (this.orderIds.has(id));
    this.orderIds.add(id);
    return id;
  }

  generateHumanitixPayloads() {
    const baseEvent = {
      id: this.generateUniqueEventId(),
      name: 'Comedy Night at The Laugh Track',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    return {
      orderCreated: {
        event_type: 'order.created',
        data: {
          event: baseEvent,
          order: {
            id: this.generateUniqueOrderId(),
            status: 'paid',
            total_amount: 5000, // $50.00 AUD
            currency: 'AUD',
            created_at: new Date().toISOString(),
            customer: {
              email: 'comedy.fan@example.com',
              first_name: 'Sarah',
              last_name: 'Johnson'
            },
            tickets: [
              {
                id: this.generateId('tkt_'),
                ticket_type_id: 'general_admission',
                ticket_type_name: 'General Admission',
                quantity: 2,
                price: 2500 // $25.00 each
              }
            ]
          }
        },
        timestamp: new Date().toISOString()
      },

      orderUpdated: {
        event_type: 'order.updated',
        data: {
          event: baseEvent,
          order: {
            id: this.generateUniqueOrderId(),
            status: 'paid',
            total_amount: 7500, // $75.00 AUD (updated amount)
            currency: 'AUD',
            created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
            customer: {
              email: 'updated.customer@example.com',
              first_name: 'Michael',
              last_name: 'Smith'
            },
            tickets: [
              {
                id: this.generateId('tkt_'),
                ticket_type_id: 'vip',
                ticket_type_name: 'VIP Access',
                quantity: 1,
                price: 5000 // $50.00
              },
              {
                id: this.generateId('tkt_'),
                ticket_type_id: 'general_admission',
                ticket_type_name: 'General Admission',
                quantity: 1,
                price: 2500 // $25.00
              }
            ]
          }
        },
        timestamp: new Date().toISOString()
      },

      orderCancelled: {
        event_type: 'order.cancelled',
        data: {
          event: baseEvent,
          order: {
            id: this.generateUniqueOrderId(),
            status: 'cancelled',
            total_amount: 5000,
            currency: 'AUD',
            created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            customer: {
              email: 'cancelled.order@example.com',
              first_name: 'Alex',
              last_name: 'Wilson'
            },
            tickets: [
              {
                id: this.generateId('tkt_'),
                ticket_type_id: 'general_admission',
                ticket_type_name: 'General Admission',
                quantity: 2,
                price: 2500
              }
            ]
          }
        },
        timestamp: new Date().toISOString()
      },

      orderRefunded: {
        event_type: 'order.refunded',
        data: {
          event: baseEvent,
          order: {
            id: this.generateUniqueOrderId(),
            status: 'refunded',
            total_amount: 5000,
            currency: 'AUD',
            created_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            customer: {
              email: 'refund.request@example.com',
              first_name: 'Emma',
              last_name: 'Davis'
            },
            tickets: [
              {
                id: this.generateId('tkt_'),
                ticket_type_id: 'general_admission',
                ticket_type_name: 'General Admission',
                quantity: 2,
                price: 2500
              }
            ]
          }
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  generateEventbritePayloads() {
    const baseEventId = Math.floor(Math.random() * 1000000000).toString();
    const baseOrderId = Math.floor(Math.random() * 1000000000).toString();
    const webhookId = this.generateId('wh_');
    const userId = this.generateId('usr_');

    return {
      orderPlaced: {
        config: {
          action: 'order.placed',
          user_id: userId,
          endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
          webhook_id: webhookId
        },
        api_url: `https://www.eventbriteapi.com/v3/events/${baseEventId}/orders/${baseOrderId}/`
      },

      orderUpdated: {
        config: {
          action: 'order.updated',
          user_id: userId,
          endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
          webhook_id: webhookId
        },
        api_url: `https://www.eventbriteapi.com/v3/events/${baseEventId}/orders/${Math.floor(Math.random() * 1000000000)}/`
      },

      orderRefunded: {
        config: {
          action: 'order.refunded',
          user_id: userId,
          endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
          webhook_id: webhookId
        },
        api_url: `https://www.eventbriteapi.com/v3/events/${baseEventId}/orders/${Math.floor(Math.random() * 1000000000)}/`
      },

      attendeeUpdated: {
        config: {
          action: 'attendee.updated',
          user_id: userId,
          endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
          webhook_id: webhookId
        },
        api_url: `https://www.eventbriteapi.com/v3/events/${baseEventId}/attendees/${Math.floor(Math.random() * 1000000000)}/`
      },

      attendeeCheckedIn: {
        config: {
          action: 'attendee.checked_in',
          user_id: userId,
          endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
          webhook_id: webhookId
        },
        api_url: `https://www.eventbriteapi.com/v3/events/${baseEventId}/attendees/${Math.floor(Math.random() * 1000000000)}/`
      }
    };
  }

  generateEventbriteOrderMockData(orderId) {
    return {
      id: orderId,
      status: 'placed',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      costs: {
        base_price: {
          display: '$45.00',
          currency: 'AUD',
          value: 4500,
          major_value: '45.00'
        },
        eventbrite_fee: {
          display: '$2.25',
          currency: 'AUD',
          value: 225,
          major_value: '2.25'
        },
        gross: {
          display: '$47.25',
          currency: 'AUD',
          value: 4725,
          major_value: '47.25'
        },
        payment_fee: {
          display: '$1.50',
          currency: 'AUD',
          value: 150,
          major_value: '1.50'
        },
        tax: {
          display: '$0.00',
          currency: 'AUD',
          value: 0,
          major_value: '0.00'
        }
      },
      created: new Date().toISOString(),
      changed: new Date().toISOString(),
      refunded: false,
      attendees: [
        {
          id: this.generateId('att_'),
          quantity: 1,
          ticket_class_id: 'general',
          ticket_class_name: 'General Admission'
        }
      ]
    };
  }

  generateStressTestPayloads(platform, count = 10) {
    const payloads = [];
    const generator = platform === 'humanitix' 
      ? this.generateHumanitixPayloads.bind(this)
      : this.generateEventbritePayloads.bind(this);

    for (let i = 0; i < count; i++) {
      const platformPayloads = generator();
      const payloadTypes = Object.keys(platformPayloads);
      const randomType = payloadTypes[Math.floor(Math.random() * payloadTypes.length)];
      payloads.push({
        type: randomType,
        payload: platformPayloads[randomType],
        sequence: i + 1
      });
    }

    return payloads;
  }

  generateEdgeCasePayloads(platform) {
    if (platform === 'humanitix') {
      return {
        emptyTickets: {
          event_type: 'order.created',
          data: {
            event: {
              id: this.generateUniqueEventId(),
              name: 'Empty Tickets Test',
              date: new Date().toISOString()
            },
            order: {
              id: this.generateUniqueOrderId(),
              status: 'paid',
              total_amount: 0,
              currency: 'AUD',
              created_at: new Date().toISOString(),
              customer: {
                email: 'empty@example.com',
                first_name: 'Empty',
                last_name: 'Tickets'
              },
              tickets: []
            }
          },
          timestamp: new Date().toISOString()
        },

        unpaidOrder: {
          event_type: 'order.created',
          data: {
            event: {
              id: this.generateUniqueEventId(),
              name: 'Unpaid Order Test',
              date: new Date().toISOString()
            },
            order: {
              id: this.generateUniqueOrderId(),
              status: 'pending',
              total_amount: 2500,
              currency: 'AUD',
              created_at: new Date().toISOString(),
              customer: {
                email: 'unpaid@example.com',
                first_name: 'Unpaid',
                last_name: 'Order'
              },
              tickets: [
                {
                  id: this.generateId('tkt_'),
                  ticket_type_id: 'general',
                  ticket_type_name: 'General Admission',
                  quantity: 1,
                  price: 2500
                }
              ]
            }
          },
          timestamp: new Date().toISOString()
        },

        largeOrder: {
          event_type: 'order.created',
          data: {
            event: {
              id: this.generateUniqueEventId(),
              name: 'Large Order Test',
              date: new Date().toISOString()
            },
            order: {
              id: this.generateUniqueOrderId(),
              status: 'paid',
              total_amount: 50000, // $500.00
              currency: 'AUD',
              created_at: new Date().toISOString(),
              customer: {
                email: 'large.order@example.com',
                first_name: 'Large',
                last_name: 'Order'
              },
              tickets: Array.from({ length: 20 }, (_, i) => ({
                id: this.generateId('tkt_'),
                ticket_type_id: 'general',
                ticket_type_name: 'General Admission',
                quantity: 1,
                price: 2500
              }))
            }
          },
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        invalidEventId: {
          config: {
            action: 'order.placed',
            user_id: this.generateId('usr_'),
            endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
            webhook_id: this.generateId('wh_')
          },
          api_url: 'https://www.eventbriteapi.com/v3/events/invalid-event-id/orders/123456789/'
        },

        invalidOrderId: {
          config: {
            action: 'order.placed',
            user_id: this.generateId('usr_'),
            endpoint_url: 'https://standupapi.com.au/webhooks/eventbrite',
            webhook_id: this.generateId('wh_')
          },
          api_url: 'https://www.eventbriteapi.com/v3/events/123456789/orders/invalid-order-id/'
        }
      };
    }
  }

  savePayloadsToFile(payloads, filename) {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = '/root/agents/scripts/webhook-testing/payloads';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(payloads, null, 2));
    
    console.log(`💾 Payloads saved to: ${filepath}`);
    return filepath;
  }

  generateAll() {
    console.log('🏗️  Generating webhook test payloads...\n');

    // Generate standard payloads
    const humanitixPayloads = this.generateHumanitixPayloads();
    const eventbritePayloads = this.generateEventbritePayloads();

    // Generate edge case payloads
    const humanitixEdgeCases = this.generateEdgeCasePayloads('humanitix');
    const eventbriteEdgeCases = this.generateEdgeCasePayloads('eventbrite');

    // Generate stress test payloads
    const humanitixStressTest = this.generateStressTestPayloads('humanitix', 50);
    const eventbriteStressTest = this.generateStressTestPayloads('eventbrite', 50);

    // Save all payloads
    const allPayloads = {
      humanitix: {
        standard: humanitixPayloads,
        edgeCases: humanitixEdgeCases,
        stressTest: humanitixStressTest
      },
      eventbrite: {
        standard: eventbritePayloads,
        edgeCases: eventbriteEdgeCases,
        stressTest: eventbriteStressTest
      },
      metadata: {
        generated: new Date().toISOString(),
        totalPayloads: {
          humanitix: Object.keys(humanitixPayloads).length + Object.keys(humanitixEdgeCases).length + humanitixStressTest.length,
          eventbrite: Object.keys(eventbritePayloads).length + Object.keys(eventbriteEdgeCases).length + eventbriteStressTest.length
        }
      }
    };

    this.savePayloadsToFile(allPayloads, 'webhook-test-payloads.json');

    // Save individual files for easy access
    this.savePayloadsToFile(humanitixPayloads, 'humanitix-standard.json');
    this.savePayloadsToFile(eventbritePayloads, 'eventbrite-standard.json');
    this.savePayloadsToFile(humanitixEdgeCases, 'humanitix-edge-cases.json');
    this.savePayloadsToFile(eventbriteEdgeCases, 'eventbrite-edge-cases.json');

    console.log('✅ Payload generation complete!');
    console.log(`📊 Generated ${allPayloads.metadata.totalPayloads.humanitix} Humanitix payloads`);
    console.log(`📊 Generated ${allPayloads.metadata.totalPayloads.eventbrite} Eventbrite payloads`);

    return allPayloads;
  }
}

// Run generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new WebhookPayloadGenerator();
  generator.generateAll();
}

export { WebhookPayloadGenerator };