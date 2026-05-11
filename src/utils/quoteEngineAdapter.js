import { calculateRecurringQuote, calculateCommercialQuote } from './pricingEngine';

/**
 * Translates Concierge Funnel state into Pricing Engine inputs 
 * and returns a high-end estimate range.
 */
export function getConciergeEstimate(data) {
  if (data.serviceCategory === 'commercial') {
    const commercialResult = calculateCommercialQuote({
      propertyType: data.propertyType || 'office',
      sqft: data.sqft || 1000,
      condition: data.clutterLevel === 'high' ? 'heavy' : 'average',
      frequency: data.frequency === 'one-time' ? '1x' : '2x',
      scope: [],
      pricingTier: 'high'
    });
    
    return {
      type: 'commercial',
      min: commercialResult.perVisit.min,
      max: commercialResult.perVisit.max,
      monthlyMin: commercialResult.monthly.min,
      monthlyMax: commercialResult.monthly.max,
      confidence: 0.8
    };
  }

  // Residential / Airbnb Logic
  const pricingData = {
    bedrooms: data.bedrooms || 1,
    bathrooms: data.bathrooms || 1,
    serviceType: data.serviceCategory === 'airbnb' ? 'airbnbTurnover' : 'standard',
    condition: mapClutterToCondition(data.clutterLevel),
    addons: [],
    frequency: data.frequency || 'one-time',
    pricingTier: 'high'
  };

  // Add specific addons based on operational data
  if (data.hasPets) pricingData.addons.push('petHair');
  
  const result = calculateRecurringQuote(pricingData);
  
  // Calculate range (±10% for luxury feel, tightening as we get more info)
  const base = result.firstMonthTotal;
  const variance = calculateVariance(data);
  
  return {
    type: 'residential',
    min: Math.round(base * (1 - variance)),
    max: Math.round(base * (1 + variance)),
    exact: base,
    confidence: 1 - variance,
    ongoingMin: Math.round(result.ongoingMonthlyTotal * (1 - variance)),
    ongoingMax: Math.round(result.ongoingMonthlyTotal * (1 + variance))
  };
}

function mapClutterToCondition(clutter) {
  switch (clutter) {
    case 'high': return 'heavy';
    case 'medium': return 'standard';
    case 'low': return 'standard';
    default: return 'standard';
  }
}

function calculateVariance(data) {
  let variance = 0.20; // Start with 20% variance
  
  if (data.bedrooms && data.bathrooms) variance -= 0.05;
  if (data.clutterLevel) variance -= 0.05;
  if (data.hasPets !== undefined) variance -= 0.05;
  if (data.serviceCategory) variance -= 0.03;
  
  return Math.max(0.05, variance); // Never less than 5% variance for "Estimate" feel
}
