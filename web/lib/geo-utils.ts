/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lng1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lng2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Value in degrees
 * @returns Value in radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get a bounding box around a point with a given radius
 * @param lat Latitude of center point in decimal degrees
 * @param lng Longitude of center point in decimal degrees
 * @param radiusKm Radius in kilometers
 * @returns Bounding box as [minLat, minLng, maxLat, maxLng]
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): [number, number, number, number] {
  const R = 6371; // Radius of the earth in km

  // Convert radius from km to radians
  const radiusRad = radiusKm / R;

  // Convert lat/lng to radians
  const latRad = deg2rad(lat);
  const lngRad = deg2rad(lng);

  // Calculate min/max latitudes
  const minLat = latRad - radiusRad;
  const maxLat = latRad + radiusRad;

  // Calculate delta longitude
  // Use absolute latitude to avoid issues near the poles
  const deltaLng = Math.asin(Math.sin(radiusRad) / Math.cos(latRad));

  // Calculate min/max longitudes
  const minLng = lngRad - deltaLng;
  const maxLng = lngRad + deltaLng;

  // Convert back to degrees
  return [
    (minLat * 180) / Math.PI,
    (minLng * 180) / Math.PI,
    (maxLat * 180) / Math.PI,
    (maxLng * 180) / Math.PI,
  ];
}
