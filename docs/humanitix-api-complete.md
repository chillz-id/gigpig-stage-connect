# Humanitix API Complete Documentation

## Overview

This document provides a comprehensive map of all discovered Humanitix API endpoints, their structures, and usage patterns based on systematic endpoint discovery and testing.

**Base URL**: `https://api.humanitix.com/v1`

**Authentication**: All requests require an `x-api-key` header with a valid API key.

## API Authentication

### Header Format
```
x-api-key: [YOUR_API_KEY]
Content-Type: application/json
```

### Authentication Error Response
Invalid API key format returns:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid api key format provided."
}
```

---

## Discovered Endpoints

### 1. Events Endpoint

#### `GET /v1/events`

**Description**: Retrieves paginated list of events.

**Required Parameters**:
- `page` (integer): Page number (required)

**Supported Parameters**:
- `page` (integer): Page number for pagination

**Unsupported Parameters** (will return 400 error):
- `limit` - Custom page size not supported
- `expand` - Expand functionality not available
- `status` - Status filtering not supported
- `startDate` - Date filtering not supported
- `fields` - Field selection not supported

**Example Request**:
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.humanitix.com/v1/events?page=1"
```

**Response Structure**:
```json
{
  "total": 22,
  "pageSize": 100,
  "page": 1,
  "events": [
    {
      "_id": "6874a5d3eeeb85a1fdf86fbb",
      "location": "AU",
      "currency": "AUD",
      "name": "Event Name",
      "description": "HTML description",
      "slug": "event-slug",
      "userId": "user-id",
      "organiserId": "organiser-id",
      "tagIds": [],
      "classification": {
        "type": "concertOrPerformance",
        "category": "performingAndVisualArts",
        "subcategory": "comedy"
      },
      "public": true,
      "published": true,
      "suspendSales": false,
      "markedAsSoldOut": false,
      "startDate": "2025-08-10T10:30:00.000Z",
      "endDate": "2025-08-10T12:30:00.000Z",
      "dates": [{
        "_id": "date-id",
        "startDate": "2025-08-10T10:30:00.000Z",
        "endDate": "2025-08-10T12:30:00.000Z",
        "disabled": false,
        "deleted": false
      }],
      "timezone": "Australia/Perth",
      "totalCapacity": 100,
      "eventLocation": {
        "type": "address",
        "venueName": "Venue Name",
        "address": "Full Address",
        "latLng": [-32.5339889, 115.7192306],
        "addressComponents": [...],
        "placeId": "google-place-id",
        "city": "City",
        "region": "State",
        "country": "Country"
      },
      "ticketTypes": [{
        "_id": "ticket-type-id",
        "name": "General Admission",
        "price": 35,
        "quantity": 100,
        "disabled": false,
        "deleted": false,
        "isDonation": false
      }],
      "packagedTickets": [],
      "additionalQuestions": [{
        "_id": "question-id",
        "createdAt": "2025-07-14T06:43:27.647Z",
        "updatedAt": "2025-07-14T06:43:27.647Z",
        "inputType": "date",
        "question": "Date of birth",
        "required": false,
        "perOrder": false,
        "disabled": false
      }],
      "paymentOptions": {
        "refundSettings": {
          "refundPolicy": "No refunds"
        }
      },
      "affiliateCodes": [],
      "pricing": {
        "minimumPrice": 35,
        "maximumPrice": 35
      },
      "keywords": ["keyword1", "keyword2"],
      "createdAt": "2025-07-14T06:38:11.852Z",
      "updatedAt": "2025-07-14T14:02:55.238Z",
      "bannerImage": {
        "url": "https://cdn.filestackcontent.com/image-id"
      },
      "publishedAt": "2025-07-14T06:45:26.692Z",
      "url": "https://events.humanitix.com/event-slug"
    }
  ]
}
```

**Response Fields**:
- `total`: Total number of events
- `pageSize`: Number of events per page (fixed at 100)
- `page`: Current page number
- `events`: Array of event objects

### 2. Individual Event Endpoint

#### `GET /v1/events/{eventId}`

**Description**: Retrieves detailed information for a specific event.

**Parameters**:
- `eventId` (string): Event ID (required in URL path)

**Unsupported Parameters**:
- `expand` - Expand functionality not available

**Example Request**:
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.humanitix.com/v1/events/6874a5d3eeeb85a1fdf86fbb"
```

**Response**: Same structure as individual event object in events list (see above).

### 3. Event Orders Endpoint

#### `GET /v1/events/{eventId}/orders`

**Description**: Retrieves paginated list of orders for a specific event.

**Required Parameters**:
- `eventId` (string): Event ID (required in URL path)
- `page` (integer): Page number (required)

**Example Request**:
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.humanitix.com/v1/events/6874a5d3eeeb85a1fdf86fbb/orders?page=1"
```

**Response Structure**:
```json
{
  "total": 0,
  "pageSize": 100,
  "page": 1,
  "orders": []
}
```

### 4. Event Tickets Endpoint

#### `GET /v1/events/{eventId}/tickets`

**Description**: Retrieves paginated list of tickets for a specific event.

**Required Parameters**:
- `eventId` (string): Event ID (required in URL path)
- `page` (integer): Page number (required)

**Example Request**:
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.humanitix.com/v1/events/6874a5d3eeeb85a1fdf86fbb/tickets?page=1"
```

**Response Structure**:
```json
{
  "total": 0,
  "pageSize": 100,
  "page": 1,
  "tickets": []
}
```

### 5. Individual Order Endpoint

#### `GET /v1/events/{eventId}/orders/{orderId}`

**Description**: Retrieves detailed information for a specific order.

**Status**: Endpoint exists but returns 500 error with invalid order ID
**Authentication**: Requires valid API key
**Error Response**: `{"statusCode":500,"error":"Internal Server Error","message":"Something went wrong."}`

**Parameters**:
- `eventId` (string): Event ID (required in URL path)
- `orderId` (string): Order ID (required in URL path)

### 6. Order Management Endpoints

#### `POST /v1/events/{eventId}/orders`

**Description**: Create a new order for an event.

**Status**: Endpoint exists but returns 500 error without proper request body
**Authentication**: Requires valid API key
**Error Response**: `{"statusCode":500,"error":"Internal Server Error","message":"Something went wrong."}`

#### `GET /v1/events/{eventId}/orders/transfer`

**Description**: Transfer-related endpoint for orders.

**Status**: Endpoint exists but returns 500 error
**Authentication**: Requires valid API key
**Error Response**: `{"statusCode":500,"error":"Internal Server Error","message":"Something went wrong."}`

---

## Non-Existent Endpoints

The following endpoints were tested and confirmed to NOT exist (return 404):

### General Endpoints
- `GET /v1/` - Root API endpoint
- `GET /docs` - API documentation
- `GET /health` - Health check
- `GET /v1/webhooks` - Webhook management
- `GET /v1/me` - User profile
- `GET /v1/account` - Account information
- `GET /v1/analytics` - Analytics data
- `GET /v1/reports` - Reporting
- `GET /v1/search` - Search functionality
- `GET /v1/stats` - Statistics
- `GET /v1/users` - User management

### Resource-Specific Endpoints
- `GET /v1/orders` - Direct orders access
- `GET /v1/orders/{orderId}` - Direct order access
- `GET /v1/tickets` - Direct tickets access
- `GET /v1/organisers` - Organiser management
- `GET /v1/organizers` - Organizer management (US spelling)
- `GET /v1/organisers/{organiserId}` - Individual organiser

### Nested Resource Endpoints
- `GET /v1/events/{eventId}/orders/{orderId}/tickets` - Order tickets
- `GET /v1/events/{eventId}/orders/{orderId}/refunds` - Order refunds
- `OPTIONS /v1/events` - CORS options

---

## Data Structure Deep Dive

### Event Object Structure

The event object contains the following key sections:

#### Basic Information
- `_id`: Unique identifier
- `name`: Event name
- `description`: HTML description
- `slug`: URL-friendly name
- `location`: Country code (e.g., "AU")
- `currency`: Currency code (e.g., "AUD")

#### Classification
```json
{
  "type": "concertOrPerformance",
  "category": "performingAndVisualArts",
  "subcategory": "comedy"
}
```

#### Status Flags
- `public`: Whether event is public
- `published`: Whether event is published
- `suspendSales`: Whether sales are suspended
- `markedAsSoldOut`: Whether marked as sold out

#### Dates and Capacity
- `startDate`: Event start time (ISO 8601)
- `endDate`: Event end time (ISO 8601)
- `timezone`: Event timezone
- `totalCapacity`: Total capacity
- `dates`: Array of date objects for multi-date events

#### Location Information
```json
{
  "type": "address",
  "venueName": "Venue Name",
  "address": "Full Address",
  "latLng": [latitude, longitude],
  "addressComponents": [...],
  "placeId": "Google Place ID",
  "city": "City",
  "region": "State",
  "country": "Country"
}
```

#### Ticket Types
```json
{
  "_id": "ticket-type-id",
  "name": "Ticket Type Name",
  "price": 35,
  "quantity": 100,
  "disabled": false,
  "deleted": false,
  "isDonation": false
}
```

#### Additional Questions
```json
{
  "_id": "question-id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "inputType": "date|text|select|etc",
  "question": "Question text",
  "required": boolean,
  "perOrder": boolean,
  "disabled": boolean
}
```

---

## Webhook Data Structure

Based on webhook samples, order data structure includes:

### Order Created Webhook
```json
{
  "event_type": "order.created",
  "data": {
    "event": {
      "id": "evt_1234567890",
      "name": "Event Name",
      "date": "2024-02-15T19:30:00Z",
      "venue": {
        "name": "Venue Name",
        "address": "Full Address"
      }
    },
    "order": {
      "id": "ord_ABC123DEF456",
      "status": "paid",
      "total_amount": 75.00,
      "currency": "AUD",
      "created_at": "2024-01-20T10:30:00Z",
      "customer": {
        "email": "customer@example.com",
        "first_name": "First",
        "last_name": "Last",
        "phone": "+61412345678"
      },
      "tickets": [{
        "id": "tkt_111222333",
        "ticket_type_id": "tt_general",
        "ticket_type_name": "General Admission",
        "quantity": 2,
        "price": 30.00
      }],
      "payment": {
        "method": "card",
        "processor": "stripe",
        "transaction_id": "pi_1234567890"
      }
    }
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Order Refunded Webhook
```json
{
  "event_type": "order.refunded",
  "data": {
    "event": {
      "id": "evt_1234567890",
      "name": "Event Name",
      "date": "2024-02-15T19:30:00Z"
    },
    "order": {
      "id": "ord_ABC123DEF456",
      "status": "refunded",
      "total_amount": 75.00,
      "refund_amount": 75.00,
      "currency": "AUD",
      "created_at": "2024-01-20T10:30:00Z",
      "refunded_at": "2024-01-25T14:20:00Z",
      "customer": {
        "email": "customer@example.com",
        "first_name": "First",
        "last_name": "Last"
      },
      "tickets": [...],
      "refund_reason": "Customer requested cancellation"
    }
  },
  "timestamp": "2024-01-25T14:20:00Z"
}
```

---

## API Limitations

### Query Parameters
- The API has very strict parameter validation
- Only specific parameters are supported per endpoint
- Additional parameters result in 400 Bad Request errors
- No expand functionality available
- No filtering capabilities on the events endpoint

### Pagination
- Fixed page size of 100 items
- No ability to customize page size
- All list endpoints require `page` parameter

### HTTP Methods
- Only GET and POST methods tested and confirmed working
- OPTIONS method returns 404
- PUT/PATCH/DELETE methods not tested due to data integrity concerns

### Rate Limiting
- No rate limiting information observed in response headers
- No rate limiting errors encountered during testing

---

## Error Handling

### Common Error Responses

#### 400 Bad Request - Invalid Parameters
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "query should have required property 'page'"
}
```

#### 400 Bad Request - Additional Properties
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "query should NOT have additional properties 'expand'"
}
```

#### 400 Bad Request - Invalid API Key
```json
{
  "statusCode": 400,
  "error": "Bad Request", 
  "message": "Invalid api key format provided."
}
```

#### 404 Not Found - Route Not Found
```json
{
  "message": "Route GET:/v1/endpoint not found",
  "error": "Not Found",
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Something went wrong."
}
```

---

## Code Examples

### Basic Event Retrieval
```javascript
const apiKey = 'YOUR_API_KEY';
const baseUrl = 'https://api.humanitix.com/v1';

async function getEvents(page = 1) {
  const response = await fetch(`${baseUrl}/events?page=${page}`, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### Get Specific Event
```javascript
async function getEvent(eventId) {
  const response = await fetch(`${baseUrl}/events/${eventId}`, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### Get Event Orders
```javascript
async function getEventOrders(eventId, page = 1) {
  const response = await fetch(`${baseUrl}/events/${eventId}/orders?page=${page}`, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### Error Handling
```javascript
async function safeApiCall(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      throw new Error(`API Error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Network Error:', error);
    throw error;
  }
}
```

---

## Endpoint Relationship Map

```
/v1/events (GET)
├── Requires: page parameter
├── Returns: List of events with full details
└── Leads to: Individual event endpoints

/v1/events/{eventId} (GET)
├── Requires: eventId in path
├── Returns: Full event details
└── Leads to: Event-specific endpoints

/v1/events/{eventId}/orders (GET)
├── Requires: eventId in path, page parameter
├── Returns: Orders for specific event
└── Leads to: Individual order endpoints

/v1/events/{eventId}/tickets (GET)
├── Requires: eventId in path, page parameter
├── Returns: Tickets for specific event
└── Leads to: Individual ticket endpoints

/v1/events/{eventId}/orders/{orderId} (GET)
├── Requires: eventId and orderId in path
├── Status: Exists but requires valid order ID
└── Returns: Individual order details

/v1/events/{eventId}/orders (POST)
├── Requires: eventId in path, request body
├── Status: Exists but requires valid request body
└── Purpose: Create new order
```

---

## Testing and Validation

### Working Endpoints Summary
1. `GET /v1/events?page=1` ✅
2. `GET /v1/events/{eventId}` ✅
3. `GET /v1/events/{eventId}/orders?page=1` ✅
4. `GET /v1/events/{eventId}/tickets?page=1` ✅
5. `GET /v1/events/{eventId}/orders/{orderId}` ⚠️ (Exists but needs valid order ID)
6. `POST /v1/events/{eventId}/orders` ⚠️ (Exists but needs valid request body)

### Confirmed Non-Working Endpoints
- Direct order access (`/v1/orders`) - 404
- Organization management (`/v1/organisers`) - 404
- Webhook management (`/v1/webhooks`) - 404
- Analytics/reporting endpoints - 404
- Search functionality - 404
- User management - 404

---

## Recommendations

### For Development
1. **Always include pagination**: All list endpoints require `page` parameter
2. **Handle errors gracefully**: API returns specific error messages
3. **Use webhooks for real-time data**: API endpoints for orders/tickets may be limited
4. **Cache event data**: Event data appears relatively static
5. **Monitor API responses**: 500 errors suggest endpoints exist but need proper data

### For Production
1. **Implement retry logic**: For 500 errors on order endpoints
2. **Use webhook data as primary source**: For order and ticket information
3. **Fall back to API for event data**: Events endpoint is reliable
4. **Monitor API availability**: No health check endpoint available

---

## Conclusion

The Humanitix API is focused primarily on read-only event data access with limited order management capabilities. The API follows RESTful principles but has strict parameter validation and limited endpoints. Most transactional data (orders, tickets) is better accessed via webhooks rather than direct API calls.

**Key Takeaways**:
- 4 confirmed working endpoints for events and basic order/ticket listing
- 2 endpoints that exist but require valid data (order management)
- Very strict parameter validation
- No advanced filtering or search capabilities
- Webhook integration recommended for order data
- Fixed pagination size of 100 items
- Comprehensive event data structure with location, pricing, and ticket information

---

*Documentation generated through systematic endpoint discovery and testing*
*Last updated: July 14, 2025*