// Process the events response
const response = $input.all()[0].json;
let events = [];

// Handle different response formats
if (Array.isArray(response)) {
  events = response;
} else if (response && response.events && Array.isArray(response.events)) {
  events = response.events;
} else if (response && response.data && Array.isArray(response.data)) {
  events = response.data;
}

console.log(`Found ${events.length} events on page ${$json.page || 1}`);

// Check if there are more pages
const hasMore = events.length === 100; // If we got a full page, there might be more

// Return events and pagination info - add null checks
return events.map(event => ({
  json: {
    event: event || {}, // Ensure event is never undefined
    hasMore,
    nextPage: hasMore ? (($json.page || 1) + 1) : null
  }
}));