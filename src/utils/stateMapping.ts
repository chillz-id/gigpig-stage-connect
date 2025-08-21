/**
 * Australian State Mapping Utilities
 * Maps cities and regions to Australian states for customer location tracking
 */

export interface StateMapping {
  code: string;
  name: string;
  cities: string[];
  regions: string[];
}

/**
 * Australian state mapping data
 */
export const AUSTRALIAN_STATES: StateMapping[] = [
  {
    code: 'NSW',
    name: 'New South Wales',
    cities: [
      'sydney', 'newcastle', 'wollongong', 'central coast', 'penrith', 
      'liverpool', 'blacktown', 'parramatta', 'campbelltown', 'bankstown',
      'fairfield', 'manly', 'bondi', 'cronulla', 'gosford', 'katoomba',
      'blue mountains', 'hunter valley', 'port macquarie', 'coffs harbour',
      'byron bay', 'lismore', 'tamworth', 'armidale', 'orange', 'bathurst',
      'wagga wagga', 'albury', 'dubbo', 'broken hill'
    ],
    regions: ['nsw', 'new south wales']
  },
  {
    code: 'VIC',
    name: 'Victoria',
    cities: [
      'melbourne', 'geelong', 'ballarat', 'bendigo', 'frankston', 
      'dandenong', 'docklands', 'st kilda', 'brunswick', 'richmond',
      'footscray', 'preston', 'moonee ponds', 'brighton', 'toorak',
      'hawthorn', 'camberwell', 'glen waverley', 'box hill', 'warrnambool',
      'shepparton', 'latrobe valley', 'mildura', 'horsham', 'wodonga'
    ],
    regions: ['vic', 'victoria']
  },
  {
    code: 'QLD',
    name: 'Queensland',
    cities: [
      'brisbane', 'gold coast', 'sunshine coast', 'cairns', 'townsville',
      'toowoomba', 'rockhampton', 'mackay', 'bundaberg', 'hervey bay',
      'gladstone', 'noosa', 'surfers paradise', 'southport', 'coolangatta',
      'redcliffe', 'ipswich', 'logan', 'redland', 'moreton bay',
      'mount isa', 'charleville', 'longreach', 'weipa'
    ],
    regions: ['qld', 'queensland']
  },
  {
    code: 'WA',
    name: 'Western Australia',
    cities: [
      'perth', 'fremantle', 'mandurah', 'bunbury', 'geraldton', 'kalgoorlie',
      'albany', 'broome', 'port hedland', 'karratha', 'northam', 'merredin',
      'narrogin', 'katanning', 'collie', 'busselton', 'margaret river',
      'esperance', 'carnarvon', 'exmouth', 'newman', 'derby'
    ],
    regions: ['wa', 'western australia']
  },
  {
    code: 'SA',
    name: 'South Australia',
    cities: [
      'adelaide', 'mount gambier', 'whyalla', 'port lincoln', 'port augusta',
      'murray bridge', 'victor harbor', 'glenelg', 'norwood', 'unley',
      'burnside', 'tea tree gully', 'salisbury', 'playford', 'onkaparinga',
      'barossa valley', 'clare valley', 'kangaroo island', 'coober pedy',
      'ceduna', 'renmark'
    ],
    regions: ['sa', 'south australia']
  },
  {
    code: 'TAS',
    name: 'Tasmania',
    cities: [
      'hobart', 'launceston', 'devonport', 'burnie', 'ulverstone', 'kingston',
      'glenorchy', 'clarence', 'sorell', 'brighton', 'new norfolk',
      'george town', 'scottsdale', 'smithton', 'queenstown', 'strahan'
    ],
    regions: ['tas', 'tasmania']
  },
  {
    code: 'NT',
    name: 'Northern Territory',
    cities: [
      'darwin', 'alice springs', 'palmerston', 'katherine', 'tennant creek',
      'nhulunbuy', 'casuarina', 'millner', 'rapid creek', 'fannie bay',
      'stuart park', 'larrakeyah', 'the gardens', 'parap', 'woolner'
    ],
    regions: ['nt', 'northern territory']
  },
  {
    code: 'ACT',
    name: 'Australian Capital Territory',
    cities: [
      'canberra', 'civic', 'manuka', 'kingston', 'barton', 'parkes',
      'deakin', 'yarralumla', 'red hill', 'forrest', 'griffith',
      'belconnen', 'gungahlin', 'woden', 'tuggeranong', 'queanbeyan'
    ],
    regions: ['act', 'australian capital territory', 'canberra']
  }
];

/**
 * Maps a city or region name to Australian state code
 * @param location - City or region name (case insensitive)
 * @returns State code (e.g., 'NSW', 'VIC') or null if not found
 */
export function mapLocationToStateCode(location: string): string | null {
  if (!location) return null;
  
  const normalizedLocation = location.toLowerCase().trim();
  
  // First try exact region match
  for (const state of AUSTRALIAN_STATES) {
    if (state.regions.includes(normalizedLocation)) {
      return state.code;
    }
  }
  
  // Then try city match
  for (const state of AUSTRALIAN_STATES) {
    if (state.cities.includes(normalizedLocation)) {
      return state.code;
    }
  }
  
  // Try partial matches for compound names
  for (const state of AUSTRALIAN_STATES) {
    for (const city of state.cities) {
      if (normalizedLocation.includes(city) || city.includes(normalizedLocation)) {
        return state.code;
      }
    }
  }
  
  return null;
}

/**
 * Maps a city or region name to full Australian state name
 * @param location - City or region name (case insensitive)
 * @returns Full state name (e.g., 'New South Wales') or null if not found
 */
export function mapLocationToStateName(location: string): string | null {
  const stateCode = mapLocationToStateCode(location);
  if (!stateCode) return null;
  
  const state = AUSTRALIAN_STATES.find(s => s.code === stateCode);
  return state?.name || null;
}

/**
 * Gets state information from location
 * @param location - City or region name
 * @returns State information object or null
 */
export function getStateInfo(location: string): StateMapping | null {
  const stateCode = mapLocationToStateCode(location);
  if (!stateCode) return null;
  
  return AUSTRALIAN_STATES.find(s => s.code === stateCode) || null;
}

/**
 * Validates if a location is in Australia
 * @param location - Location string to check
 * @returns true if location is recognized as Australian
 */
export function isAustralianLocation(location: string): boolean {
  return mapLocationToStateCode(location) !== null;
}

/**
 * Maps Humanitix/Eventbrite region format to Australian state
 * These APIs might return 'NSW', 'Victoria', etc.
 * @param region - Region from API (could be state code or name)
 * @param city - City from API for additional context
 * @returns Standardized state code
 */
export function mapAPIRegionToState(region?: string, city?: string): string | null {
  // Try region first
  if (region) {
    const stateFromRegion = mapLocationToStateCode(region);
    if (stateFromRegion) return stateFromRegion;
  }
  
  // Fallback to city if region didn't work
  if (city) {
    const stateFromCity = mapLocationToStateCode(city);
    if (stateFromCity) return stateFromCity;
  }
  
  return null;
}

/**
 * Test function to verify mapping works correctly
 */
export function testStateMappings(): void {
  const testCases = [
    { input: 'Sydney', expected: 'NSW' },
    { input: 'Melbourne', expected: 'VIC' },
    { input: 'Brisbane', expected: 'QLD' },
    { input: 'Perth', expected: 'WA' },
    { input: 'Adelaide', expected: 'SA' },
    { input: 'Hobart', expected: 'TAS' },
    { input: 'Darwin', expected: 'NT' },
    { input: 'Canberra', expected: 'ACT' },
    { input: 'NSW', expected: 'NSW' },
    { input: 'Victoria', expected: 'VIC' },
    { input: 'Gold Coast', expected: 'QLD' },
    { input: 'Unknown City', expected: null }
  ];
  
  console.log('🧪 Testing State Mappings:');
  
  for (const testCase of testCases) {
    const result = mapLocationToStateCode(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(
      `${passed ? '✅' : '❌'} ${testCase.input} → ${result} (expected: ${testCase.expected})`
    );
  }
}