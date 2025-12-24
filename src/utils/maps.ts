/**
 * Google Maps URL helper utilities
 * Simple URL-based maps integration without API dependencies
 */

export interface VenueLocation {
  google_maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_line1?: string | null;
  address?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
}

/**
 * Generate a Google Maps URL for a venue/location
 * Priority: manual URL > lat/lng > address
 */
export function generateGoogleMapsUrl(location: VenueLocation): string | null {
  // Use manual URL if provided
  if (location.google_maps_url) {
    return location.google_maps_url;
  }

  // Generate from lat/lng (most accurate)
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  // Generate from address
  const addressParts = [
    location.address_line1 || location.address,
    location.venue,
    location.city,
    location.state,
  ].filter(Boolean);

  if (addressParts.length > 0) {
    const query = encodeURIComponent(addressParts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  return null;
}

/**
 * Generate a Google Maps directions URL
 */
export function generateGoogleMapsDirectionsUrl(location: VenueLocation): string | null {
  const mapsUrl = generateGoogleMapsUrl(location);
  if (!mapsUrl) return null;

  // Convert search URL to directions URL
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  }

  const addressParts = [
    location.address_line1 || location.address,
    location.venue,
    location.city,
    location.state,
  ].filter(Boolean);

  if (addressParts.length > 0) {
    const destination = encodeURIComponent(addressParts.join(', '));
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  return null;
}
