import { calculateRecurringQuote } from './src/utils/pricingEngine.js';

const baseProps = {
    bedrooms: 3,
    bathrooms: 2,
    condition: 'moderate',
    addons: []
};

console.log("--- Premium (Weekly) ---");
console.dir(calculateRecurringQuote({ ...baseProps, frequency: 'Premium' }), { depth: null });

console.log("\n--- Plus (Bi-Weekly) ---");
console.dir(calculateRecurringQuote({ ...baseProps, frequency: 'Plus' }), { depth: null });

console.log("\n--- Basic (Monthly) ---");
console.dir(calculateRecurringQuote({ ...baseProps, frequency: 'Basic' }), { depth: null });

console.log("\n--- One-Time ---");
console.dir(calculateRecurringQuote({ ...baseProps, frequency: 'oneTime', serviceType: 'standard' }), { depth: null });
