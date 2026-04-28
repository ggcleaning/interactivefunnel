/**
 * G&G Cleaning Services - Service Zone Configuration
 * Used to determine travel fees and distance credits based on ZIP code radius.
 */

export const HOME_OFFICE = {
  lat: 40.7895,
  lon: -73.1989 // Central Islip, NY 11722
};

export const PRICING_RULES = {
  REMOTE_FEE: 100, // Fee for distances > 40 miles
  CREDIT_THRESHOLD: 400,
  REMOTE_CREDIT: 50,
  MAX_FREE_RADIUS_MILES: 40,
};

// Haversine formula to calculate straight-line distance in miles
function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI/180);
  const rlat2 = lat2 * (Math.PI/180);
  const difflat = rlat2 - rlat1;
  const difflon = (lon2 - lon1) * (Math.PI/180);

  const d = 2 * R * Math.asin(Math.sqrt(
    Math.sin(difflat/2)*Math.sin(difflat/2) +
    Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)
  ));
  return d;
}

/**
 * Fetches coordinates for a ZIP code and calculates distance from Central Islip.
 * @param {string} zipCode 
 * @returns {Promise<{distance: number, zone: 'LOCAL' | 'REMOTE', lat?: number, lon?: number}>}
 */
export const getZipDistance = async (zipCode) => {
  if (!zipCode || zipCode.length !== 5) return { distance: 0, zone: 'LOCAL' };
  
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!res.ok) return { distance: 0, zone: 'LOCAL' };
    
    const data = await res.json();
    const place = data.places[0];
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    
    const distance = calculateDistanceMiles(HOME_OFFICE.lat, HOME_OFFICE.lon, lat, lon);
    const zone = distance > PRICING_RULES.MAX_FREE_RADIUS_MILES ? 'REMOTE' : 'LOCAL';
    
    return { distance, zone, lat, lon };
  } catch (err) {
    console.error("Error fetching zip code data", err);
    // Fallback to LOCAL if API fails
    return { distance: 0, zone: 'LOCAL' };
  }
};
