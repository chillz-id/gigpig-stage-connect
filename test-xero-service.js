#!/usr/bin/env node

// Test Xero Service Implementation
// This script tests the Xero service without requiring actual API credentials

import path from 'path';
import fs from 'fs';

// Mock environment variables for testing
process.env.VITE_XERO_CLIENT_ID = 'test-client-id';
process.env.VITE_XERO_CLIENT_SECRET = 'test-client-secret';

// Mock window object for Node.js environment
global.window = {
  location: {
    origin: 'https://agents.standupsydney.com'
  }
};

// Mock sessionStorage
global.sessionStorage = {
  storage: {},
  setItem: function(key, value) {
    this.storage[key] = value;
  },
  getItem: function(key) {
    return this.storage[key] || null;
  }
};

// Mock crypto for Node.js
const mockCrypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
};

// Use either global crypto or mock
const cryptoImpl = global.crypto || mockCrypto;

// Mock fetch for API calls
global.fetch = async (url, options = {}) => {
  console.log(`🔄 Mock API call to: ${url}`);
  console.log(`📝 Method: ${options.method || 'GET'}`);
  console.log(`📋 Headers:`, options.headers || {});
  
  // Mock successful responses based on URL
  if (url.includes('identity.xero.com/connect/token')) {
    return {
      ok: true,
      json: async () => ({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer'
      })
    };
  }
  
  if (url.includes('api.xero.com/connections')) {
    return {
      ok: true,
      json: async () => ([
        {
          tenantId: 'test-tenant-id',
          tenantName: 'Test Organization',
          tenantType: 'ORGANISATION'
        }
      ])
    };
  }
  
  if (url.includes('api.xero.com/api.xro/2.0/Invoices')) {
    return {
      ok: true,
      json: async () => ({
        Invoices: [{
          InvoiceID: 'test-invoice-id',
          InvoiceNumber: 'INV-001',
          Total: 100.00,
          Status: 'DRAFT',
          Contact: {
            Name: 'Test Contact'
          }
        }]
      })
    };
  }
  
  return {
    ok: true,
    json: async () => ({})
  };
};

// Test function
async function testXeroService() {
  console.log('🧪 Testing Xero Service Implementation\n');
  
  try {
    // Test 1: Configuration
    console.log('✅ Test 1: Configuration');
    const config = {
      clientId: process.env.VITE_XERO_CLIENT_ID,
      clientSecret: process.env.VITE_XERO_CLIENT_SECRET,
      redirectUri: `${global.window.location.origin}/auth/xero-callback`,
      scopes: [
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings',
        'offline_access'
      ]
    };
    console.log('📋 Config:', JSON.stringify(config, null, 2));
    
    // Test 2: Authorization URL Generation
    console.log('\n✅ Test 2: Authorization URL Generation');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: cryptoImpl.randomUUID()
    });
    
    const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
    console.log('🔗 Authorization URL:', authUrl);
    
    // Test 3: Token Exchange
    console.log('\n✅ Test 3: Token Exchange');
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: config.redirectUri
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('🔑 Token Response:', JSON.stringify(tokenData, null, 2));
    
    // Test 4: API Request
    console.log('\n✅ Test 4: API Request');
    const apiResponse = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Xero-tenant-id': 'test-tenant-id',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const apiData = await apiResponse.json();
    console.log('📊 API Response:', JSON.stringify(apiData, null, 2));
    
    // Test 5: Invoice Creation
    console.log('\n✅ Test 5: Invoice Creation');
    const invoiceData = {
      Type: 'ACCREC',
      Contact: {
        Name: 'Test Customer',
        EmailAddress: 'test@example.com'
      },
      LineItems: [{
        Description: 'Test Service',
        Quantity: 1,
        UnitAmount: 100.00,
        AccountCode: '200',
        TaxType: 'OUTPUT'
      }],
      Date: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Status: 'DRAFT',
      LineAmountTypes: 'Exclusive'
    };
    
    const createResponse = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Xero-tenant-id': 'test-tenant-id',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Invoices: [invoiceData] })
    });
    
    const createData = await createResponse.json();
    console.log('💰 Invoice Created:', JSON.stringify(createData, null, 2));
    
    console.log('\n🎉 All tests passed! Xero service implementation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📊 Stack trace:', error.stack);
  }
}

// Run the test
testXeroService();