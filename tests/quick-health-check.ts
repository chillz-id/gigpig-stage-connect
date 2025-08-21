import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8081';

interface HealthCheckResult {
  page: string;
  status: number;
  success: boolean;
  error?: string;
  hasContent?: boolean;
}

async function checkPage(path: string): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const text = await response.text();
    
    return {
      page: path,
      status: response.status,
      success: response.status === 200,
      hasContent: text.length > 1000 // Basic check for actual content
    };
  } catch (error) {
    return {
      page: path,
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 Running Platform Health Check...\n');
  
  const pagesToCheck = [
    '/',
    '/auth',
    '/shows',
    '/comedians',
    '/profile',
    '/dashboard',
    '/applications',
    '/events/test-123' // This might 404, which is fine
  ];
  
  const results: HealthCheckResult[] = [];
  
  for (const page of pagesToCheck) {
    const result = await checkPage(page);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const details = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${page} - Status: ${result.status}${details}`);
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total pages checked: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  // Check for common issues
  console.log('\n🔍 Common Issues Check:');
  
  // Check if server is running
  if (results.every(r => r.status === 0)) {
    console.log('❌ Server appears to be down - no pages responded');
  } else {
    console.log('✅ Server is running');
  }
  
  // Check auth page
  const authResult = results.find(r => r.page === '/auth');
  if (authResult?.success) {
    console.log('✅ Auth page is accessible');
  } else {
    console.log('❌ Auth page has issues - comedians cannot sign up');
  }
  
  // Check shows page
  const showsResult = results.find(r => r.page === '/shows');
  if (showsResult?.success) {
    console.log('✅ Shows page is accessible');
  } else {
    console.log('❌ Shows page has issues - comedians cannot browse shows');
  }
  
  return results;
}

// Run the health check
runHealthCheck().catch(console.error);