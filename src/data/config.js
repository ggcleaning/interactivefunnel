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
  phone: '516-298-8323',
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
//  ACTIVE PROMOTIONS
// ==================================================================
export const OFFERS = {
  active: true,
  headline: 'Get $40 OFF Your First Deep Cleaning',
  subheadline: 'Limited slots available for new clients this month!',
  cta: 'Claim Discount',
  code: 'DEEP40',
  expires: 'May 31, 2026'
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
    'Great Neck',
    'Roslyn',
    'Syosset',
    'Oyster Bay',
    'Port Washington',
    'Woodbury',
    'Old Brookville'
  ],
  suffolk: [
    'Dix Hills',
    'Huntington',
    'Melville',
    'Commack',
    'Smithtown',
    'Northport',
    'Plainview'
  ],
  general: ['Hempstead', 'Islip', 'Babylon', 'Brookhaven', 'Massapequa']
};

// ==================================================================
//  LOCATION SPECIFIC CONTENT
// ==================================================================
export const LOCATIONS = {
  gardenCity: {
    name: 'Garden City',
    county: 'Nassau',
    headline: 'Premium House Cleaning Services in Garden City',
    subheadline: 'Garden City homeowners trust G&G Cleaning for immaculate results and a concierge experience. From classic estate maintenance to weekly family home upkeep, we provide the level of detail your home deserves.',
    description: "G&G Cleaning provides luxury house cleaning in Garden City, NY. Standard, deep, and move-in/out services for Nassau County's finest homes.",
    faqs: [
      {
        question: "What house cleaning services do you offer in Garden City, NY?",
        answer: "G&G Cleaning offers a full range of residential cleaning services in Garden City, New York, including deep cleaning, recurring weekly and bi-weekly maid service, monthly maintenance cleaning, move-in and move-out cleaning, and post-renovation cleaning. Every service is fully customized based on your home's size, layout, and specific needs."
      },
      {
        question: "Do you clean historic homes and luxury estates in Garden City?",
        answer: "Yes. Many homes in Garden City — particularly in the Estates Section and along the Cathedral corridor — feature original woodwork and high-end surfaces that require careful handling. Our team is trained to clean historic residences using methods that protect original finishes."
      }
    ]
  },
  manhasset: {
    name: 'Manhasset',
    county: 'Nassau',
    headline: 'Expert Residential Cleaning in Manhasset',
    subheadline: 'G&G Cleaning brings a higher standard of clean to Manhasset and the North Shore. Our dedicated crews understand the expectations of busy professionals and active families in the community.',
    description: "Professional house cleaning in Manhasset, NY. G&G Cleaning offers reliable recurring maid services and deep cleans across the North Shore.",
    faqs: [
      {
        question: "What house cleaning services do you offer in Manhasset, NY?",
        answer: "G&G Cleaning offers a full range of residential cleaning services in Manhasset, New York, including deep cleaning, recurring weekly and bi-weekly maid service, monthly maintenance cleaning, move-in and move-out cleaning, and post-renovation cleaning. Every service is fully customized based on your home's size, layout, and specific needs."
      },
      {
        question: "Do you clean historic homes and luxury estates in Manhasset?",
        answer: "Yes. Many homes in Manhasset feature custom stonework, original moldings, and high-end surfaces that require careful handling. Our team is trained to clean historic and high-end residences using methods that protect original finishes while delivering a thorough clean."
      },
      {
        question: "Do you serve Plandome, Flower Hill, and the Strathmores?",
        answer: "Absolutely. We regularly clean homes throughout all Manhasset neighborhoods including Plandome, Flower Hill, Strathmore, Strathmore-Vanderbilt, and surrounding residential streets."
      }
    ]
  },
  dixHills: {
    name: 'Dix Hills',
    county: 'Suffolk',
    headline: 'Dix Hills’ Most Trusted Home Cleaning Service',
    subheadline: 'Keep your Dix Hills estate pristine without the stress. G&G Cleaning provides reliable, high-end cleaning services tailored to the needs of Suffolk County’s most discerning homeowners.',
    description: "Trusted house cleaning in Dix Hills, NY. Deep cleaning, weekly maintenance, and specialized move-out services for Suffolk County residents.",
    faqs: [
      {
        question: "What house cleaning services do you offer in Dix Hills, NY?",
        answer: "G&G Cleaning offers a full range of residential cleaning services in Dix Hills, including deep cleaning, recurring weekly and bi-weekly maid service, monthly maintenance cleaning, and move-in/move-out cleaning tailored to Suffolk County's large estates."
      },
      {
        question: "Do you specialize in cleaning large homes in Dix Hills?",
        answer: "Yes. Many Dix Hills homes exceed 3,000–5,000 square feet. Our team is specifically trained to clean large residences systematically, ensuring nothing is rushed or overlooked while protecting high-end materials."
      }
    ]
  },
  huntington: {
    name: 'Huntington',
    county: 'Suffolk',
    headline: 'Professional House Cleaning in Huntington',
    subheadline: 'From Huntington Village to the hills of Lloyd Harbor, G&G Cleaning provides the reliable, high-quality cleaning services that Huntington families have trusted for over 15 years.',
    description: "Expert house cleaning services in Huntington, NY. We offer deep cleans, recurring maid services, and move-in/out cleaning for all Huntington neighborhoods.",
    faqs: [
      {
        question: "Do you serve Huntington Station and South Huntington as well?",
        answer: "Yes, G&G Cleaning proudly serves the entire Huntington area, including Huntington Village, Huntington Station, South Huntington, Lloyd Harbor, and Cold Spring Harbor."
      },
      {
        question: "Can I book a same-day cleaning in Huntington?",
        answer: "While we recommend booking 48 hours in advance, we often have last-minute openings in the Huntington area. Use our online calculator to check real-time availability."
      }
    ]
  },
  syosset: {
    name: 'Syosset',
    county: 'Nassau',
    headline: 'Top-Rated Maid Service in Syosset',
    subheadline: 'Syosset families lead busy lives. Let G&G Cleaning handle the housework so you can enjoy your time. Professional, insured, and family-owned since 2008.',
    description: "Reliable house cleaning in Syosset, NY. G&G Cleaning provides deep cleaning and recurring maintenance for Syosset homeowners.",
    faqs: [
      {
        question: "Are your cleaners background-checked for Syosset homes?",
        answer: "Absolutely. Every member of our team is vetted, background-checked, and fully insured, giving you total peace of mind when we enter your Syosset residence."
      }
    ]
  },
  roslyn: {
    name: 'Roslyn',
    county: 'Nassau',
    headline: 'Luxury Home Cleaning in Roslyn',
    subheadline: 'G&G Cleaning specializes in the high-end residential cleaning Roslyn residents expect. Detailed, discreet, and dedicated to perfection in every room.',
    description: "Premium house cleaning services in Roslyn, NY. Specialized deep cleaning and maintenance for Roslyn and Roslyn Heights estates.",
    faqs: [
      {
        question: "Do you clean high-end finishes and custom materials common in Roslyn homes?",
        answer: "Yes. Our team is trained to handle marble, quartz, custom hardwood, and high-end fixtures with the specific care they require, using safe and effective cleaning methods."
      }
    ]
  },
  oysterBay: {
    name: 'Oyster Bay',
    county: 'Nassau',
    headline: 'Oyster Bay’s Local Cleaning Experts',
    subheadline: 'We bring a personal touch to every home in Oyster Bay. Our family-owned business treats your home with the same care and respect we give our own.',
    description: "Professional house cleaning in Oyster Bay, NY. G&G Cleaning offers reliable recurring maid services and deep cleans.",
    faqs: [
      {
        question: "How long have you been serving the Oyster Bay community?",
        answer: "G&G Cleaning has been serving Long Island homeowners, including those in Oyster Bay, since 2008."
      }
    ]
  },
  portWashington: {
    name: 'Port Washington',
    county: 'Nassau',
    headline: 'Reliable House Cleaning in Port Washington',
    subheadline: 'Port Washington residents trust G&G Cleaning for consistent, high-quality results. Whether you need a one-time deep clean or weekly service, we make it easy.',
    description: "Expert home cleaning in Port Washington, NY. Deep cleaning and recurring service options tailored to your lifestyle.",
    faqs: [
      {
        question: "What cleaning packages are available for Port Washington homes?",
        answer: "We offer tailored deep cleaning, bi-weekly maintenance, move-in/move-out cleaning, and eco-friendly options for all Port Washington waterfront and hillside residences."
      },
      {
        question: "Are your cleaning teams insured and background-checked?",
        answer: "Yes, 100% of our team members are fully background-checked, insured, and trained to respect your privacy and property."
      }
    ]
  },
  greatNeck: {
    name: 'Great Neck',
    county: 'Nassau',
    headline: 'Great Neck’s Premier Cleaning Service',
    subheadline: 'Exceptional cleaning for Great Neck estates and residences. We provide a level of detail and reliability that stands out in the community.',
    description: "High-end house cleaning in Great Neck, NY. G&G Cleaning offers deep cleaning and recurring maintenance for discerning homeowners.",
    faqs: [
      {
        question: "Do you service Great Neck Estates, Kings Point, and Saddle Rock?",
        answer: "Yes, we regularly service homes throughout Great Neck including Kings Point, Saddle Rock, Great Neck Plaza, and Russell Gardens."
      },
      {
        question: "Can I request pet-friendly and non-toxic cleaning products?",
        answer: "Absolutely. We bring non-toxic, child-safe, and pet-friendly cleaning solutions for every job upon request at no extra charge."
      }
    ]
  },
  woodbury: {
    name: 'Woodbury',
    county: 'Nassau',
    headline: 'Professional Maid Service in Woodbury',
    subheadline: 'Keep your Woodbury home beautiful with G&G Cleaning. Our professional teams are trained to deliver a spotless result every single time.',
    description: "Top-rated house cleaning in Woodbury, NY. Deep cleaning and weekly maid services available.",
    faqs: [
      {
        question: "How do I schedule recurring weekly or bi-weekly cleaning in Woodbury?",
        answer: "You can book directly using our instant online calculator or call our team at 516-298-8323 to lock in your preferred day and time slot."
      }
    ]
  },
  melville: {
    name: 'Melville',
    county: 'Suffolk',
    headline: 'Melville Home Cleaning You Can Count On',
    subheadline: 'G&G Cleaning provides Melville homeowners with a stress-free cleaning experience. Reliable, professional, and thorough.',
    description: "Reliable residential cleaning in Melville, NY. We offer deep cleaning and recurring maintenance services.",
    faqs: [
      {
        question: "Do you offer commercial or office cleaning in Melville?",
        answer: "Yes, in addition to luxury residential homes, we offer tailored commercial and office cleaning solutions along the Melville corporate corridor."
      }
    ]
  },
  commack: {
    name: 'Commack',
    county: 'Suffolk',
    headline: 'Commack’s Local House Cleaning Team',
    subheadline: 'Quality cleaning services right in your neighborhood. Commack families trust G&G Cleaning for all their home maintenance needs.',
    description: "Professional house cleaning in Commack, NY. G&G Cleaning offers reliable deep cleaning and recurring maid services.",
    faqs: [
      {
        question: "What is your 24-Hour Satisfaction Guarantee?",
        answer: "If you aren't completely happy with any area cleaned in your Commack home, let us know within 24 hours and we'll re-clean it free of charge."
      }
    ]
  },
  smithtown: {
    name: 'Smithtown',
    county: 'Suffolk',
    headline: 'Expert House Cleaning in Smithtown',
    subheadline: 'G&G Cleaning brings over 15 years of experience to Smithtown homes. Let our family take care of yours with a premium clean.',
    description: "Trusted home cleaning in Smithtown, NY. Deep cleaning and recurring service options for all Smithtown residents.",
    faqs: [
      {
        question: "Do you clean homes in Nesconset, St. James, and Hauppauge?",
        answer: "Yes, we serve the broader Smithtown area including Nesconset, St. James, San Remo, and Hauppauge."
      }
    ]
  }
};

// ==================================================================
//  DEEP CLEANING CHECKLIST
// ==================================================================
export const CHECKLIST = [
  {
    category: 'Kitchen',
    icon: '🍳',
    count: '11 Areas',
    items: [
      'Clean and sanitize all countertops and backsplash',
      'Clean exterior of all cabinets and drawers',
      'Sanitize sink, polish faucet and fixtures',
      'Degrease stovetop, burners, and range hood',
      'Clean exterior of all appliances',
      'Clean inside microwave completely',
      'Wipe down and sanitize small appliances',
      'Clean behind and under reachable appliances',
      'Vacuum and mop all floors including edges',
      'Wipe interior and exterior of oven door',
      'Spot clean reachable interior cabinet areas',
    ]
  },
  {
    category: 'Bathrooms',
    icon: '🚿',
    count: '10 Areas',
    items: [
      'Scrub and disinfect toilets inside and out',
      'Clean and sanitize sinks and countertops',
      'Polish mirrors and all glass surfaces',
      'Scrub showers and tubs, remove soap scum',
      'Clean tile and grout thoroughly',
      'Polish all fixtures and hardware',
      'Clean exhaust fans and vents',
      'Mop floors including corners and behind toilet',
      'Wipe door frames, handles, and switches',
      'Empty and sanitize wastebaskets',
    ]
  },
  {
    category: 'Bedrooms',
    icon: '🛏️',
    count: '8 Areas',
    items: [
      'Dust all furniture, nightstands, and dressers',
      'Clean mirrors and all glass surfaces',
      'Dust light fixtures and ceiling fans',
      'Dust baseboards and window sills',
      'Dust blinds and reachable window tracks',
      'Vacuum under beds and all reachable floor areas',
      'Vacuum carpets and rugs / mop hard floors',
      'Make beds upon request',
    ]
  },
  {
    category: 'Living Areas',
    icon: '🛋️',
    count: '8 Areas',
    items: [
      'Dust all furniture, shelves, and electronics',
      'Clean glass tables and surfaces',
      'Dust baseboards and door frames throughout',
      'Clean light fixtures and ceiling fans',
      'Remove cobwebs and dust vents',
      'Vacuum carpets and rugs / mop hard floors',
      'Wipe all light switches and outlet covers',
      'Straighten cushions and general tidying',
    ]
  }
];

export const DEEP_CLEAN_FAQS = [
  {
    question: "What is included in a professional deep house cleaning?",
    answer: "A professional deep house cleaning covers every major area of your home at a level beyond standard maintenance cleaning. At G&G Cleaning, our deep clean includes full kitchen degreasing, appliance cleaning, bathroom scrubbing, grout cleaning, dusting baseboards, vents, ceiling fans, and a complete whole-home detail pass."
  },
  {
    question: "How is a deep cleaning different from a regular cleaning?",
    answer: "A regular cleaning keeps your home presentable. A deep cleaning targets built-up grease, soap scum, dust accumulation, and overlooked areas like behind appliances, exhaust fans, window tracks, and baseboards. It's a full reset for your home."
  },
  {
    question: "How long does a deep cleaning take for a Long Island home?",
    answer: "For most 3 to 4 bedroom homes on Long Island, a professional deep clean takes between 4 and 8 hours depending on size and condition. Larger estates in Garden City or Manhasset may require more time."
  },
  {
    question: "Do I need to be home during the deep cleaning?",
    answer: "No. Most clients provide access via a key or code. Our team is fully insured, bonded, and background-checked, so you can trust us with your home."
  }
];

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
