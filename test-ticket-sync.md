# Ticket Sync Mock Mode Test

## Overview

The ticket sync functionality has been successfully implemented with mock mode for development. Here's what was added:

## 1. Mock Mode for Humanitix API Service

When no API key is configured (`VITE_HUMANITIX_API_KEY`), the service runs in mock mode:

- **Mock Events**: Generates realistic comedy events with venues in Sydney
- **Mock Ticket Types**: 
  - General Admission ($35)
  - VIP Front Row ($65)
  - Early Bird Special ($25 - sold out)
- **Mock Orders**: 20-50 orders with random customer data
- **Mock Data Features**:
  - Realistic pricing with platform fees (3.5%)
  - Random ticket sales distribution
  - Proper date formatting
  - Australian phone numbers

## 2. Mock Mode for Eventbrite API Service

When no API key is configured (`VITE_EVENTBRITE_API_KEY`), the service runs in mock mode:

- **Mock Events**: Stand-up showcase events with detailed venue information
- **Mock Ticket Classes**:
  - Standard Admission ($40)
  - Premium Seating ($70)
  - Group Discount 4+ ($30 - mostly sold out)
- **Mock Orders**: 30-60 orders with attendee information
- **Mock Data Features**:
  - Eventbrite fee structure
  - Multiple attendees per order
  - Australian currency (AUD)
  - Realistic venue data

## 3. Enhanced Ticket Sync Service

The ticket sync service now handles mock mode gracefully:

- Automatically creates demo platforms when none exist
- Handles both real and mock API calls
- Provides feedback on sync success/failure
- Updates event totals after syncing

## 4. Updated UI Components

### EventTicketSalesTab Enhancements:

- **Sync Button**: Located in the "Ticket Sources" card header
  - Shows loading state while syncing
  - Displays success/failure messages
  - Disabled during sync operation

- **Last Sync Time**: Shows when tickets were last synced
  - Displayed next to sync button
  - Format: HH:mm (e.g., "14:30")

- **Auto-refresh**: Data refreshes every 30 seconds

## Usage Instructions

1. **Mock Mode (No API Keys)**:
   - The system automatically runs in mock mode
   - Click "Sync Tickets" to generate mock ticket data
   - Data will appear in the ticket sales table

2. **Production Mode (With API Keys)**:
   - Set environment variables:
     - `VITE_HUMANITIX_API_KEY`
     - `VITE_EVENTBRITE_API_KEY`
   - Click "Sync Tickets" to pull real data from platforms

3. **Features Available**:
   - View ticket sales breakdown by platform
   - Search and filter ticket sales
   - Export data to CSV
   - Real-time sync status

## Console Output

When running in mock mode, you'll see:
```
Humanitix API key not configured - running in mock mode
Eventbrite API key not configured - running in mock mode
Running in mock mode - creating demo platforms
[MOCK] Humanitix API call to /events/mock-event-123
[MOCK] Eventbrite API call to /events/123456789
```

## Mock Data Characteristics

- **Realistic Names**: Uses common first and last names
- **Email Patterns**: firstname.lastname@example.com
- **Purchase Dates**: Random distribution over last 30-40 days
- **Refund Rate**: ~2-5% of orders marked as refunded
- **Ticket Distribution**: Varied quantities per order
- **Revenue Calculations**: Includes fees and taxes

This mock mode allows full testing of the ticket sync functionality without requiring actual API credentials or external services.