/**
 * G&G Cleaning Services - Service Zone Configuration
 * Used to determine travel fees, distance credits, and Long Island service area qualification.
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
 * Validates if a ZIP code belongs to Nassau or Suffolk County on Long Island, NY.
 * @param {string} zipCode 
 * @returns {boolean}
 */
export const isLongIslandZip = (zipCode) => {
  if (!zipCode || zipCode.length !== 5) return false;
  const zip = parseInt(zipCode, 10);
  if (isNaN(zip)) return false;

  // Nassau & Suffolk County ZIP code ranges
  const isNassauOrSuffolkRange = 
    (zip >= 11001 && zip <= 11005) || // Floral Park, New Hyde Park, Elmont
    (zip >= 11020 && zip <= 11027) || // Great Neck area
    (zip >= 11030 && zip <= 11055) || // Manhasset, Port Washington, etc.
    zip === 11096 ||                  // Inwood
    (zip >= 11501 && zip <= 11599) || // Garden City, Mineola, Hempstead, Valley Stream, etc.
    (zip >= 11701 && zip <= 11798) || // Central Islip, Dix Hills, Huntington, Melville, Syosset, Woodbury, etc.
    (zip >= 11801 && zip <= 11805) || // Hicksville, Jericho
    (zip >= 11901 && zip <= 11980);   // Suffolk East End & North Fork

  return isNassauOrSuffolkRange;
};

/**
 * Fetches coordinates for a ZIP code and calculates distance from Central Islip.
 * Also performs state & county service area qualification.
 * @param {string} zipCode 
 * @returns {Promise<{distance: number, zone: 'LOCAL' | 'REMOTE', lat?: number, lon?: number, status: 'IN_SERVICE_AREA' | 'OUT_OF_STATE' | 'OUT_OF_COUNTY', isServiceable: boolean, state?: string, placeName?: string}>}
 */
export const getZipDistance = async (zipCode) => {
  if (!zipCode || zipCode.length !== 5) {
    return { distance: 0, zone: 'LOCAL', status: 'OUT_OF_COUNTY', isServiceable: false, state: '', placeName: '' };
  }

  const isLIRange = isLongIslandZip(zipCode);
  
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!res.ok) {
      const status = isLIRange ? 'IN_SERVICE_AREA' : 'OUT_OF_COUNTY';
      return { distance: 0, zone: 'LOCAL', status, isServiceable: status === 'IN_SERVICE_AREA', state: 'NY', placeName: '' };
    }
    
    const data = await res.json();
    const place = data.places[0] || {};
    const stateAbbr = (place["state abbreviation"] || place.state_abbreviation || "").toUpperCase();
    const placeName = place["place name"] || place.place_name || "";
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    
    let status = 'IN_SERVICE_AREA';
    if (stateAbbr !== 'NY') {
      status = 'OUT_OF_STATE';
    } else if (!isLIRange) {
      status = 'OUT_OF_COUNTY';
    }

    const isServiceable = status === 'IN_SERVICE_AREA';
    const distance = (lat && lon) ? calculateDistanceMiles(HOME_OFFICE.lat, HOME_OFFICE.lon, lat, lon) : 0;
    const zone = distance > PRICING_RULES.MAX_FREE_RADIUS_MILES ? 'REMOTE' : 'LOCAL';
    
    return { distance, zone, lat, lon, status, isServiceable, state: stateAbbr, placeName };
  } catch (err) {
    console.error("Error fetching zip code data", err);
    const status = isLIRange ? 'IN_SERVICE_AREA' : 'OUT_OF_COUNTY';
    return { distance: 0, zone: 'LOCAL', status, isServiceable: status === 'IN_SERVICE_AREA', state: 'NY', placeName: '' };
  }
};

