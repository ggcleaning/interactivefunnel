/**
 * G&G CLEANING SERVICES — PRICING ENGINE
 * Single source of truth for all quote logic.
 */

// ── RESIDENTIAL PRICING CONFIG ───────────────────────────────────────────
export const PRICING_CONFIG = {
    baseRates: {
        standard: 140,
        deep: 195,
        moveOut: 245,
        postConstruction: 285,
        airbnbTurnover: 125,
        commercial: 180
    },
    multipliers: {
        frequency: {
            oneTime: 1.0,
            weekly: 0.85,    // 15% discount
            biweekly: 0.90,  // 10% discount
            monthly: 0.95    // 5% discount
        },
        condition: {
            standard: 1.0,
            heavy: 1.25,
            extreme: 1.5
        },
        tier: {
            high: 1.0,
            medium: 0.85,
            low: 0.70
        }
    },
    roomRates: {
        bedroom: 25,
        bathroom: 35
    },
    addons: [
        { key: 'fridge', label: 'Inside Refrigerator', icon: '❄️', price: 35 },
        { key: 'oven', label: 'Inside Oven', icon: '🔥', price: 35 },
        { key: 'windows', label: 'Interior Windows', icon: '🪟', price: 50 },
        { key: 'baseboards', label: 'Baseboards', icon: '🧽', price: 55 },
        { key: 'cabinets', label: 'Inside Cabinets', icon: '🗄️', price: 45 },
        { key: 'laundry', label: 'Laundry Service', icon: '🧺', price: 35 },
        { key: 'dishes', label: 'Hand-Wash Dishes', icon: '🍽️', price: 25 },
        { key: 'petHair', label: 'Heavy Pet Hair Removal', icon: '🐾', price: 30 },
        { key: 'garage', label: 'Garage Sweep/Clean', icon: '🚗', price: 45 },
        { key: 'basement', label: 'Basement Cleaning', icon: '🧱', price: 65 }
    ]
};

// Internal metadata for desk display
export const ADDON_META_INTERNAL = PRICING_CONFIG.addons;
export const ADDON_META = PRICING_CONFIG.addons;

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// ── COMMERCIAL PRICING CONFIG ────────────────────────────────────────────
export const COMMERCIAL_CONFIG = {
    baseRates: {
        office: { min: 0.08, max: 0.15 },
        medical: { min: 0.12, max: 0.20 },
        retail: { min: 0.10, max: 0.18 },
        warehouse: { min: 0.05, max: 0.12 },
        gym: { min: 0.12, max: 0.22 },
        school: { min: 0.10, max: 0.16 },
        restaurant: { min: 0.15, max: 0.25 },
        other: { min: 0.10, max: 0.18 }
    },
    multipliers: {
        condition: {
            light: 0.9,
            average: 1.0,
            heavy: 1.2,
            deep: 1.5
        },
        frequency: {
            '1x': 1.0,
            '2x': 0.95,
            '3x': 0.90,
            '5x': 0.85,
            'custom': 0.90
        },
        tier: {
            high: 1.0,
            medium: 0.85,
            low: 0.70
        }
    },
    scopeAddons: {
        windowCleaning: 0.02, // extra per sqft
        carpetCleaning: 0.03, // extra per sqft
        floorBuffing: 0.04,   // extra per sqft
        disinfection: 1.20    // 20% multiplier
    }
};

// ── CALCULATION FUNCTIONS ────────────────────────────────────────────────

/**
 * Standard Residential Logic
 */
export const calculateRecurringQuote = (data) => {
    const { 
        bedrooms, bathrooms, serviceType, condition, addons = [], frequency,
        useHourlyPricing, estimatedHours, hourlyRate,
        useSqftPricing, ratePerSqft, sqft,
        pricingTier = 'high'
    } = data;

    let baseRate = PRICING_CONFIG.baseRates[serviceType] || PRICING_CONFIG.baseRates.standard;
    
    let bedroomsTotal = bedrooms * PRICING_CONFIG.roomRates.bedroom;
    let bathroomsTotal = bathrooms * PRICING_CONFIG.roomRates.bathroom;
    let roomsTotal = bedroomsTotal + bathroomsTotal;

    if (useHourlyPricing) {
        baseRate = estimatedHours * hourlyRate;
        bedroomsTotal = 0;
        bathroomsTotal = 0;
        roomsTotal = 0;
    } else if (useSqftPricing) {
        baseRate = sqft * ratePerSqft;
        bedroomsTotal = 0;
        bathroomsTotal = 0;
        roomsTotal = 0;
    }

    const addonsTotal = addons.reduce((sum, key) => {
        const addon = PRICING_CONFIG.addons.find(a => a.key === key);
        return sum + (addon ? addon.price : 0);
    }, 0);

    const conditionMult = PRICING_CONFIG.multipliers.condition[condition] || 1.0;
    const freqMult = PRICING_CONFIG.multipliers.frequency[frequency] || 1.0;
    const tierMult = PRICING_CONFIG.multipliers.tier[pricingTier] || 1.0;

    const preConditionSubtotal = baseRate + roomsTotal + addonsTotal;
    const subtotal = preConditionSubtotal * conditionMult * tierMult;
    const conditionFee = (preConditionSubtotal * conditionMult) - preConditionSubtotal;
    const tierDiscount = (preConditionSubtotal * conditionMult) - subtotal; // positive means discount

    const firstMonthTotal = Math.round(subtotal);
    const ongoingMonthlyTotal = Math.round(subtotal * freqMult);

    return {
        firstMonthTotal,
        ongoingMonthlyTotal,
        baseSubtotal: Math.round(baseRate + roomsTotal),
        addonsTotal: Math.round(addonsTotal),
        savings: Math.round(subtotal - ongoingMonthlyTotal),
        
        // Breakdown for UI
        startingCost: Math.round(baseRate),
        bedroomsTotal: Math.round(bedroomsTotal),
        bathroomsTotal: Math.round(bathroomsTotal),
        roomsTotal: Math.round(roomsTotal),
        conditionFee: Math.round(conditionFee),
        tierDiscount: Math.round(tierDiscount)
    };
};

/**
 * Commercial Logic
 */
export const calculateCommercialQuote = (data) => {
    const { 
        propertyType, 
        sqft, 
        condition, 
        frequency, 
        scope = [],
        pricingTier = 'high'
    } = data;

    const rates = COMMERCIAL_CONFIG.baseRates[propertyType] || COMMERCIAL_CONFIG.baseRates.other;
    const condMult = COMMERCIAL_CONFIG.multipliers.condition[condition] || 1.0;
    const freqMult = COMMERCIAL_CONFIG.multipliers.frequency[frequency] || 1.0;
    const tierMult = COMMERCIAL_CONFIG.multipliers.tier[pricingTier] || 1.0;

    // Calculate Min/Max Base
    let minVisit = sqft * rates.min * condMult * tierMult;
    let maxVisit = sqft * rates.max * condMult * tierMult;

    // Add Scope Fees
    if (scope.includes('windowCleaning')) {
        minVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.windowCleaning);
        maxVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.windowCleaning);
    }
    if (scope.includes('carpetCleaning')) {
        minVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.carpetCleaning);
        maxVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.carpetCleaning);
    }
    if (scope.includes('floorBuffing')) {
        minVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.floorBuffing);
        maxVisit += (sqft * COMMERCIAL_CONFIG.scopeAddons.floorBuffing);
    }
    if (scope.includes('disinfection')) {
        minVisit *= COMMERCIAL_CONFIG.scopeAddons.disinfection;
        maxVisit *= COMMERCIAL_CONFIG.scopeAddons.disinfection;
    }

    // Apply Frequency Discount to Monthly calculation
    const visitsPerWeek = frequency === '5x' ? 5 : (frequency === '3x' ? 3 : (frequency === '2x' ? 2 : 1));
    const visitsPerMonth = visitsPerWeek * 4.33; // Average weeks per month
    
    const monthlyMin = minVisit * visitsPerMonth * freqMult;
    const monthlyMax = maxVisit * visitsPerMonth * freqMult;

    // One-time deep clean fee (if requested)
    const deepCleanFee = condition === 'deep' ? (sqft * 0.20 * tierMult) : 0;

    return {
        perVisit: {
            min: Math.round(minVisit),
            max: Math.round(maxVisit)
        },
        monthly: {
            min: Math.round(monthlyMin),
            max: Math.round(monthlyMax)
        },
        deepCleanFee: Math.round(deepCleanFee),
        recommendedFrequency: frequency === 'custom' ? 'To be determined' : `${frequency.replace('x', '')} times per week`
    };
};

/**
 * Travel Fees Logic
 */
export const getDistancePricing = (baseTotal, zone) => {
    let travelFee = 0;
    if (zone === 'far') travelFee = 35;
    else if (zone === 'extended') travelFee = 55;
    else if (zone === 'out_of_range') travelFee = 85;

    return {
        travelFee,
        finalTotal: baseTotal + travelFee
    };
};
