/**
 * Calculate the distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a student's GPS coordinates are within the room's geofence.
 */
export function isWithinGeofence(
  studentLat: number,
  studentLon: number,
  roomLat: number,
  roomLon: number,
  radiusMeters: number
): { withinRange: boolean; distance: number } {
  const distance = haversineDistance(studentLat, studentLon, roomLat, roomLon);
  return {
    withinRange: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}
