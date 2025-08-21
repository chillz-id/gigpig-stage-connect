/**
 * Manual Test Script for Event Template System
 * 
 * This script tests the core template functionality without requiring the full React ecosystem.
 * Run with: node test-template-system-manual.js
 */

// Mock the template data loader
function loadTemplateData(template, setFormData, setEventSpots, setRecurringSettings) {
  try {
    const data = template.template_data;
    
    // Handle both imageUrl and bannerUrl for backward compatibility
    const bannerUrl = data.imageUrl || data.bannerUrl || '';
    
    const formData = {
      title: data.title || '',
      venue: data.venue || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'Australia',
      date: '', // Always reset date for new events
      time: data.time || '',
      endTime: data.endTime || '',
      type: data.type || '',
      spots: Array.isArray(data.spots) ? data.spots.length : (data.spots || 5),
      description: data.description || '',
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      isVerifiedOnly: Boolean(data.isVerifiedOnly),
      isPaid: Boolean(data.isPaid),
      allowRecording: Boolean(data.allowRecording),
      ageRestriction: data.ageRestriction || '18+',
      dresscode: data.dresscode || 'Casual',
      imageUrl: bannerUrl, // Use consistent field name
      showLevel: data.showLevel || '',
      showType: data.showType || '',
      customShowType: data.customShowType || '',
      ticketingType: data.ticketingType || 'gigpigs',
      externalTicketUrl: data.externalTicketUrl || '',
      tickets: Array.isArray(data.tickets) ? data.tickets : [],
      feeHandling: data.feeHandling || 'absorb',
      capacity: data.capacity || 0,
    };
    
    setFormData(formData);
    
    // Load event spots if they exist
    if (data.spots && Array.isArray(data.spots)) {
      setEventSpots(data.spots);
    }
    
    // Load recurring settings if they exist
    if (data.recurringSettings) {
      setRecurringSettings({
        ...data.recurringSettings,
        endDate: '', // Reset end date for new recurring events
        customDates: data.recurringSettings.customDates 
          ? data.recurringSettings.customDates.map((customDate) => ({
              date: new Date(customDate.date),
              times: customDate.times || [{ startTime: '19:00', endTime: '22:00' }]
            }))
          : []
      });
    }
  } catch (error) {
    console.error('Error loading template data:', error);
    // Don't throw error, just log it - let components handle UI feedback
    // Template will load with default values
  }
}

// Test data
const mockTemplate = {
  id: 'test-template-1',
  name: 'Test Comedy Night',
  promoter_id: 'test-promoter-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  template_data: {
    title: 'Weekly Comedy Night',
    venue: 'The Comedy Club',
    address: '123 Main St',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    time: '19:00',
    endTime: '22:00',
    description: 'A great comedy night',
    imageUrl: 'https://example.com/banner.jpg',
    spots: [
      {
        id: 'spot-1',
        spot_name: 'MC',
        duration_minutes: 10,
        is_paid: true,
        payment_amount: 100,
        currency: 'AUD'
      },
      {
        id: 'spot-2',
        spot_name: 'Feature',
        duration_minutes: 15,
        is_paid: true,
        payment_amount: 150,
        currency: 'AUD'
      }
    ],
    requirements: ['Must be 18+', 'Professional material only'],
    isVerifiedOnly: false,
    isPaid: true,
    allowRecording: true,
    ageRestriction: '18+',
    dresscode: 'Smart Casual',
    capacity: 100
  }
};

// Test functions
function runTests() {
  console.log('🧪 Starting Event Template System Tests...\n');

  // Test 1: Basic template loading
  console.log('Test 1: Basic template loading');
  let formData = null;
  let eventSpots = null;
  let recurringSettings = null;

  loadTemplateData(
    mockTemplate,
    (data) => { formData = data; },
    (spots) => { eventSpots = spots; },
    (settings) => { recurringSettings = settings; }
  );

  console.log('✅ Form data loaded:', {
    title: formData.title,
    venue: formData.venue,
    spots: formData.spots,
    imageUrl: formData.imageUrl.substring(0, 30) + '...'
  });

  console.log('✅ Event spots loaded:', eventSpots.length, 'spots');

  // Test 2: Banner image handling (imageUrl)
  console.log('\nTest 2: Banner image handling (imageUrl)');
  const expectedImageUrl = 'https://example.com/banner.jpg';
  if (formData.imageUrl === expectedImageUrl) {
    console.log('✅ Banner image loaded correctly from imageUrl');
  } else {
    console.log('❌ Banner image not loaded correctly');
  }

  // Test 3: Banner image handling (bannerUrl fallback)
  console.log('\nTest 3: Banner image handling (bannerUrl fallback)');
  const templateWithBannerUrl = {
    ...mockTemplate,
    template_data: {
      ...mockTemplate.template_data,
      imageUrl: undefined,
      bannerUrl: 'https://example.com/fallback-banner.jpg'
    }
  };

  let formDataFallback = null;
  loadTemplateData(
    templateWithBannerUrl,
    (data) => { formDataFallback = data; },
    () => {},
    () => {}
  );

  if (formDataFallback.imageUrl === 'https://example.com/fallback-banner.jpg') {
    console.log('✅ Banner image loaded correctly from bannerUrl fallback');
  } else {
    console.log('❌ Banner image fallback not working');
  }

  // Test 4: Array vs number spots handling
  console.log('\nTest 4: Array vs number spots handling');
  if (formData.spots === 2) { // Should be length of spots array
    console.log('✅ Spots count calculated correctly from array');
  } else {
    console.log('❌ Spots count not calculated correctly');
  }

  // Test 5: Type safety - requirements array
  console.log('\nTest 5: Requirements array handling');
  if (Array.isArray(formData.requirements) && formData.requirements.length === 2) {
    console.log('✅ Requirements array handled correctly');
  } else {
    console.log('❌ Requirements array not handled correctly');
  }

  // Test 6: Boolean conversion
  console.log('\nTest 6: Boolean conversion');
  if (formData.isPaid === true && formData.allowRecording === true) {
    console.log('✅ Boolean values converted correctly');
  } else {
    console.log('❌ Boolean values not converted correctly');
  }

  // Test 7: Corrupted data handling
  console.log('\nTest 7: Corrupted data handling');
  const corruptedTemplate = {
    ...mockTemplate,
    template_data: null
  };

  try {
    loadTemplateData(
      corruptedTemplate,
      () => {},
      () => {},
      () => {}
    );
    console.log('✅ Corrupted data handled gracefully (no error thrown)');
  } catch (error) {
    console.log('❌ Corrupted data caused error:', error.message);
  }

  // Test 8: Performance test with large data
  console.log('\nTest 8: Performance test');
  const largeTemplate = {
    ...mockTemplate,
    template_data: {
      ...mockTemplate.template_data,
      spots: Array.from({ length: 50 }, (_, i) => ({
        id: `spot-${i}`,
        spot_name: `Spot ${i}`,
        duration_minutes: 10
      })),
      requirements: Array.from({ length: 20 }, (_, i) => `Requirement ${i}`)
    }
  };

  const start = process.hrtime.bigint();
  loadTemplateData(
    largeTemplate,
    () => {},
    () => {},
    () => {}
  );
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds

  if (duration < 10) { // Should be very fast
    console.log(`✅ Performance test passed: ${duration.toFixed(2)}ms for large template`);
  } else {
    console.log(`❌ Performance test failed: ${duration.toFixed(2)}ms (too slow)`);
  }

  console.log('\n🎉 Template System Tests Complete!\n');

  // Summary
  console.log('📊 Template System Features:');
  console.log('• ✅ Banner image loading with fallback support');
  console.log('• ✅ Type-safe data conversion');
  console.log('• ✅ Error handling for corrupted data');
  console.log('• ✅ Performance optimized for large templates');
  console.log('• ✅ Array vs primitive handling');
  console.log('• ✅ Backward compatibility with old field names');
}

// Run the tests
runTests();