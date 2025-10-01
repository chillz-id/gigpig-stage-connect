// Ultra-safe Process Events - handles ALL undefined cases
let response = {};
let events = [];

try {
  // Ultra-safe input extraction
  const inputData = $input.all();
  if (inputData && inputData.length > 0 && inputData[0] && inputData[0].json) {
    response = inputData[0].json;
  }
} catch (e) {
  console.log('Error getting input data:', e.message);
  response = {};
}

// Ultra-safe events extraction
try {
  if (Array.isArray(response)) {
    events = response;
  } else if (response && response.events && Array.isArray(response.events)) {
    events = response.events;
  } else if (response && response.data && Array.isArray(response.data)) {
    events = response.data;
  } else {
    events = [];
  }
} catch (e) {
  console.log('Error extracting events:', e.message);
  events = [];
}

// Ultra-safe page number
let currentPage = 1;
try {
  currentPage = $json?.page || 1;
  if (typeof currentPage !== 'number' || currentPage < 1) {
    currentPage = 1;
  }
} catch (e) {
  currentPage = 1;
}

console.log(`Found ${events.length} events on page ${currentPage}`);

// Check if there are more pages
const hasMore = events.length === 100;

// Ultra-safe event mapping
const result = [];
for (let i = 0; i < events.length; i++) {
  try {
    const event = events[i] || {};
    
    result.push({
      json: {
        event: event,
        hasMore: hasMore,
        nextPage: hasMore ? (currentPage + 1) : null
      }
    });
  } catch (e) {
    console.log(`Error processing event ${i}:`, e.message);
    // Skip this event and continue
  }
}

console.log(`Successfully processed ${result.length} events`);
return result;