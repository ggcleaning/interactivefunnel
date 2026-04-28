// ==================================================================
//  BUSINESS CONFIGURATION — GG Cleaning Services
//  This file is the single source of truth for all business data.
//  To reuse this system for another business, update this file only.
// ==================================================================

export const BUSINESS = {
  name: 'G&G Cleaning Services',
  tagline: 'Professional House Cleaning on Long Island Since 2008',
  founded: '2008',
  founderName: 'Griselda Alas',
  phone: '+1 888-792-2909',
  email: 'info@ggcleaningli.com',
  website: 'https://ggcleaningli.com',
  address: {
    street: '31 Kirby Lane',
    city: 'Central Islip',
    state: 'NY',
    zip: '11722'
  },
  serviceArea: 'Nassau & Suffolk County, Long Island, NY',
  hours: {
    weekdays: '8:00 AM - 5:00 PM',
    saturday: '9:00 AM - 3:00 PM',
    sunday: 'Closed'
  },
  trustBadges: [
    { icon: '🏠', title: 'Family-Owned & Operated', sub: 'A business built on trust since 2008' },
    { icon: '📍', title: 'Nassau & Suffolk County', sub: 'Proudly serving our Long Island neighbors' },
    { icon: '⭐', title: '5.0 Stars on Google', sub: 'Based on verified Google reviews' },
    { icon: '✅', title: 'Satisfaction Guaranteed', sub: 'We make it right within 24 hours' },
    { icon: '🔒', title: 'Fully Insured & Bonded', sub: 'Your home and belongings are protected' },
  ],
};

// ==================================================================
//  SERVICE PACKAGES
// ==================================================================
export const PACKAGES = [
  {
    id: 'standard',
    icon: '🧹',
    name: 'Standard Cleaning',
    desc: 'Your home, consistently fresh. Our most popular service for busy households wanting reliable, ongoing maintenance.',
    price: '$120',
    priceNote: '– $180 / visit',
    includes: [
      'Kitchen surfaces, counters & sink',
      'Bathroom scrub, toilet, tub & sink',
      'Dusting all surfaces & furniture',
      'Vacuuming all floors & rugs',
      'Mopping hard floors',
      'Trash removal throughout home',
      'Bed-making (client provides linens)',
    ],
    ideal: 'Busy families & dual-income households on weekly or bi-weekly schedules',
    featured: false,
  },
  {
    id: 'deep',
    icon: '🧼',
    name: 'Deep Cleaning',
    desc: 'A thorough, top-to-bottom clean. Perfect for first-time clients or homes needing extra attention before a recurring schedule begins.',
    price: '$220',
    priceNote: '– $400+ based on size',
    includes: [
      'Everything in Standard Cleaning',
      'Inside appliances (microwave & dishwasher)',
      'Detailed scrub of showers & tile grout',
      'Baseboards, door frames & light switches',
      'Cabinet exteriors top to bottom',
      'Window sills & blind wiping',
      'Behind & under furniture',
      'Interior window ledges & tracks',
    ],
    ideal: 'First-time clients, post-renovation cleans & seasonal deep cleans',
    featured: true,
    tag: 'Most Popular',
  },
  {
    id: 'moveout',
    icon: '🚪',
    name: 'Move-In / Move-Out',
    desc: 'Leave your old place spotless or arrive to a fresh start. Our most detailed residential package, built for transitions.',
    price: '$300',
    priceNote: '– $500+ based on size',
    includes: [
      'Everything in Deep Cleaning',
      'Inside oven & refrigerator',
      'All cabinet interiors & drawers',
      'Interior windows cleaned',
      'All closets wiped inside & out',
      'Full appliance exterior & interior',
      'Garage sweep (upon request)',
      'Balcony / patio sweep (upon request)',
    ],
    ideal: 'Renters, homeowners, property managers & realtors',
    featured: false,
  },
];

// ==================================================================
//  ADD-ON SERVICES
// ==================================================================
export const ADDONS = [
  { id: 'fridge',     icon: '❄️', name: 'Inside Refrigerator', note: 'Full interior wipe-down & shelf cleaning', price: '$25–$50' },
  { id: 'oven',       icon: '🔥', name: 'Inside Oven',          note: 'Degreasing & rack cleaning',               price: '$25–$60' },
  { id: 'windows',    icon: '🪟', name: 'Interior Windows',     note: 'Streak-free clean, priced per window',     price: '$5–$10 ea.' },
  { id: 'baseboards', icon: '🧽', name: 'Baseboards',           note: 'Detailed wipe of all baseboard trim',      price: '$40–$100' },
  { id: 'laundry',    icon: '👕', name: 'Laundry & Folding',    note: 'Wash, dry & fold one load',                price: '$20–$40' },
  { id: 'cabinets',   icon: '🗄️', name: 'Cabinet Cleaning',     note: 'Interior & exterior of all cabinets',      price: '$50–$120' },
];

// ==================================================================
//  RECURRING PLANS
// ==================================================================
export const RECURRING_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    frequency: '1x Monthly Cleaning',
    price: '5% Savings',
    priceLabel: 'off one-time rate',
    depositAmount: 50,
    features: [
      '1 standard cleaning per month',
      '5% member savings on every visit',
      'Priority scheduling',
      'Flexible rescheduling',
      'No long-term contract',
      'Ideal for light monthly upkeep',
    ],
    featured: false,
  },
  {
    id: 'plus',
    name: 'Plus Plan',
    frequency: '2x Monthly Cleanings',
    price: '10% Savings',
    priceLabel: 'off one-time rate',
    depositAmount: 50,
    features: [
      '2 standard cleanings per month',
      '10% member savings on every visit',
      'Higher priority scheduling',
      'Dedicated account manager',
      'No long-term contract',
      'Best for busy families',
    ],
    featured: true,
    tag: 'Most Popular',
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    frequency: 'Priority Recurring Care',
    price: 'Max Savings',
    priceLabel: '+ Quarterly Perks',
    depositAmount: 50,
    features: [
      '2 standard cleanings per month',
      '1 FREE Premium Perk every quarter',
      'Dedicated cleaning team',
      'Top-tier scheduling priority',
      'Quarterly home condition reports',
      'Ideal for premium households',
    ],
    featured: false,
    tag: 'VIP Status',
  },
];

export const PLAN_NOTES = {
  pricing: 'Final pricing depends on your home size and specific needs. Savings apply to your custom quote.',
  operational: 'First-time recurring clients typically begin with an initial deep cleaning to establish a baseline.',
  perks: ['Inside Fridge', 'Inside Oven', 'Interior Windows', 'Detailed Baseboards'],
};



// ==================================================================
//  SAVINGS & PERKS
// ==================================================================
export const SAVINGS_PERKS = [
  { icon: '🎁', title: 'First-Time Booking Discount', desc: '$25 off your first standard cleaning, or 10% off your first visit — no strings attached.' },
  { icon: '🤝', title: 'Referral Reward',             desc: 'Refer a friend and receive $25 off your next cleaning after their completed service.' },
  { icon: '💎', title: 'Subscription Savings',        desc: 'Recurring members always receive better pricing than one-time bookings.' },
  { icon: '📅', title: 'Annual Prepay Option',        desc: 'Lock in your rate, secure priority scheduling, and protect against future price increases.' },
];

// ==================================================================
//  COMMERCIAL SERVICES
// ==================================================================
export const COMMERCIAL_SERVICES = [
  {
    id: 'office',
    icon: '🏢',
    name: 'Office Cleaning',
    desc: 'Keep your workspace clean, professional, and welcoming for your team and clients every day.',
    priceNote: 'Starting at $150 – $500 / month',
    items: [
      'Desks, surfaces & common areas',
      'Restroom sanitation & restocking',
      'Kitchen & break room cleaning',
      'Trash removal & floor care',
      'Weekly or bi-weekly contracts available',
    ],
    full: false,
  },
  {
    id: 'retail',
    icon: '🔧',
    name: 'Auto Shop & Retail',
    desc: 'Specialized cleaning for high-traffic commercial spaces that need a reliable, consistent team.',
    priceNote: 'Custom Pricing Based on Size',
    items: [
      'Shop floors, waiting areas & bathrooms',
      'Degreasing & surface sanitation',
      'Showroom & retail floor care',
      'Flexible scheduling around business hours',
      'Monthly contracts preferred',
    ],
    full: false,
  },
  {
    id: 'contract',
    icon: '📋',
    name: 'Need a Custom Contract?',
    desc: 'Every commercial space is unique. We build flexible monthly contracts around your schedule, budget, and specific needs.',
    priceNote: null,
    items: [
      'Flexible weekly, bi-weekly, or monthly scheduling',
      'Dedicated cleaning team assigned to your location',
      'Transparent flat-rate monthly billing',
      'Priority scheduling & response',
    ],
    full: true,
  },
];

// ==================================================================
//  TESTIMONIALS
// ==================================================================
export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Massapequa, NY',
    rating: 5,
    text: 'G&G Cleaning is absolutely amazing! My house has never looked this clean. They even cleaned behind the fridge. Highly recommend!',
  },
  {
    id: 2,
    name: 'James K.',
    location: 'Hicksville, NY',
    rating: 5,
    text: 'Used them for a move-out clean. The landlord was blown away. Got my full deposit back. Worth every penny!',
  },
  {
    id: 3,
    name: 'Lisa T.',
    location: 'Huntington, NY',
    rating: 5,
    text: 'Very professional and responsive. They showed up on time and did a deep clean that left our home spotless. Will be booking monthly!',
  },
  {
    id: 4,
    name: 'Mike R.',
    location: 'Babylon, NY',
    rating: 5,
    text: "Best cleaning service I've used on Long Island. Family-run and it shows — they treat your home like it's their own.",
  },
];

// ==================================================================
//  NAVIGATION
// ==================================================================
export const NAV_LINKS = [
  { label: 'Home',            path: '/' },
  { label: 'Services',        path: '/services' },
  { label: 'Pricing',         path: '/pricing' },
  { label: 'Recurring Plans', path: '/plans' },
  { label: 'Commercial',      path: '/commercial' },
  { label: 'Get a Quote',     path: '/quote', isHighlight: true },
];

// ==================================================================
//  SERVICE AREAS (AI & SEO CLUSTERS)
// ==================================================================
export const SERVICE_AREAS = {
  nassau: [
    'Garden City',
    'Manhasset',
    'Great Neck Estates',
    'Roslyn Heights',
    'Old Brookville',
    'Upper Brookville',
    'Kensington',
    'East Hills'
  ],
  suffolk: [
    'Dix Hills',
    'Huntington Village',
    'Melville',
    'Smithtown',
    'Woodbury',
    'Plainview'
  ],
  general: ['Hempstead', 'Islip', 'Babylon', 'Brookhaven', 'Massapequa', 'Commack']
};

// ==================================================================
//  FAQ ENGINE (ANSWER ENGINE READINESS)
// ==================================================================
export const FAQS = [
  {
    question: "What areas of Long Island do you serve?",
    answer: "We proudly serve all of Nassau and Suffolk County, with a primary focus on areas like Garden City, Manhasset, Dix Hills, Huntington, and Melville."
  },
  {
    question: "Are you fully insured and bonded?",
    answer: "Yes. G&G Cleaning Services is fully insured and bonded to ensure your home, belongings, and our team are completely protected during every visit."
  },
  {
    question: "How do I get an instant cleaning quote?",
    answer: "You can use our online Instant Calculator on the homepage to see your price range in under 60 seconds. No email or phone number is required to see your estimate."
  },
  {
    question: "What’s included in a Deep Cleaning service?",
    answer: "Our Deep Cleaning is a top-to-bottom reset. It includes everything in a standard clean plus detailed scrubbing of baseboards, inside appliances (microwave/dishwasher), window sills, and light switches."
  },
  {
    question: "Do I need to be home during the cleaning?",
    answer: "No, many of our clients provide a key or keypad code. We are a family-owned business trusted by Long Island homeowners since 2008."
  },
  {
    question: "Do you bring your own cleaning supplies and equipment?",
    answer: "Yes, we provide all professional-grade cleaning supplies and equipment. If you have specific products you'd like us to use, just let us know!"
  },
  {
    question: "Is your cleaning safe for pets and children?",
    answer: "Absolutely. we use professional cleaning solutions that are safe for your family and your pets."
  },
  {
    question: "How long will a typical cleaning take?",
    answer: "A standard clean usually takes 2-4 hours, while a Move-In/Move-Out or Deep Clean can take 4-7 hours depending on the size and condition of the home."
  },
  {
    question: "What is your 24-hour satisfaction guarantee?",
    answer: "If you aren't 100% happy with a specific area we cleaned, call us within 24 hours and we will come back and fix it for free."
  },
  {
    question: "Do you offer commercial cleaning for offices or retail?",
    answer: "Yes! We serve small businesses, offices, retail shops, and auto shops across Nassau and Suffolk County with custom monthly contracts."
  },
  {
    question: "How do I pay for my cleaning service?",
    answer: "We accept all major credit cards, cash, and digital payments. You can pay securely through our booking system or at the time of service."
  },
  {
    question: "How do I cancel or reschedule my appointment?",
    answer: "We ask for at least 24 hours' notice for cancellations. You can reschedule by calling us or using your client portal link."
  },
  {
    question: "Are your cleaners background-checked?",
    answer: "Yes. Every member of our family-run team is vetted and background-checked to ensure the highest level of safety and trust."
  },
  {
    question: "What items or areas do you NOT clean?",
    answer: "For safety reasons, we do not clean biohazards (mold, waste), high-reach areas above a 2-step ladder, or heavy furniture moving."
  },
  {
    question: "How often should I book a cleaning service?",
    answer: "Most of our clients prefer bi-weekly maintenance. However, we offer weekly, monthly, and one-time deep cleaning to fit your lifestyle."
  }
];
