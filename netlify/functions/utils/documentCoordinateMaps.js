/**
 * documentCoordinateMaps.js
 * 
 * Centralized coordinate mapping for G&G Cleaning Services documents.
 * Assumptions:
 * - Page Size: Letter (612 x 792)
 * - Origin: Bottom-Left (pdf-lib default)
 * - Conversion formula: pdf_lib_y = 792 - fitz_y
 */

const PAGE_HEIGHT = 792;

const DOCUMENT_CONFIG = {
  font: {
    size: {
      default: 9.5,
      small: 8,
      large: 13,
      header: 10
    },
    color: {
      navy: [0.05, 0.05, 0.45], // Dark navy
      gray: [0.3, 0.3, 0.3],
      green: [0.1, 0.5, 0.1]
    }
  }
};

const PROPOSAL_MAP = {
  page1: {
    // Checkboxes
    oneTimeTick: { x: 134, y: PAGE_HEIGHT - 154, size: 10 },
    
    // Header
    dateIssued: { x: 420, y: PAGE_HEIGHT - 112, size: 8, color: 'gray' },
    
    // Client Info
    clientName: { x: 116, y: PAGE_HEIGHT - 267 },
    clientPhone: { x: 93, y: PAGE_HEIGHT - 292 },
    clientEmail: { x: 89, y: PAGE_HEIGHT - 317 },
    clientAddress: { x: 100, y: PAGE_HEIGHT - 342 },
    clientCityZip: { x: 97, y: PAGE_HEIGHT - 367 },
    
    // Property Details
    propertyType: { x: 379, y: PAGE_HEIGHT - 267 },
    bedrooms: { x: 363, y: PAGE_HEIGHT - 292 },
    bathrooms: { x: 366, y: PAGE_HEIGHT - 317 },
    condition: { x: 360, y: PAGE_HEIGHT - 342 },
    addons: { x: 356, y: PAGE_HEIGHT - 367 },
    
    // Plan Overview
    planName: { x: 62, y: PAGE_HEIGHT - 460, size: 8.5 },
    frequency: { x: 155, y: PAGE_HEIGHT - 460, size: 8.5 },
    month1Visits: { x: 250, y: PAGE_HEIGHT - 460, size: 8.5 },
    ongoingVisits: { x: 358, y: PAGE_HEIGHT - 460, size: 8.5 },
    travelFeeLabel: { x: 475, y: PAGE_HEIGHT - 460, size: 8.5 },
    
    // Pricing Breakdown
    basePrice: { x: 453, y: PAGE_HEIGHT - 571, size: 9 },
    serviceMult: { x: 453, y: PAGE_HEIGHT - 611, size: 9 },
    conditionMult: { x: 453, y: PAGE_HEIGHT - 651, size: 9 },
    subtotal: { x: 453, y: PAGE_HEIGHT - 681, size: 9 },
    discount: { x: 453, y: PAGE_HEIGHT - 712, size: 9 },
    
    // Bottom Note
    appointmentNote: { x: 49, y: PAGE_HEIGHT - 730, size: 8, color: 'gray' }
  },
  page2: {
    firstTimeDiscount: { x: 453, y: PAGE_HEIGHT - 64, size: 9 },
    addonsTotal: { x: 453, y: PAGE_HEIGHT - 90, size: 9 },
    travelFeeAmount: { x: 453, y: PAGE_HEIGHT - 119, size: 9 },
    
    // Large Summary Totals (need whiteout or precise placement)
    firstMonthTotal: { x: 94, y: PAGE_HEIGHT - 195, size: 13, bold: true },
    firstMonthPerVisit: { x: 92, y: PAGE_HEIGHT - 231, size: 8.5 },
    ongoingMonthly: { x: 269, y: PAGE_HEIGHT - 195, size: 13, bold: true },
    ongoingPerVisit: { x: 267, y: PAGE_HEIGHT - 231, size: 8.5 },
    depositToday: { x: 444, y: PAGE_HEIGHT - 195, size: 13, bold: true },
    depositNote: { x: 432, y: PAGE_HEIGHT - 213, size: 8.5, color: 'green' },
    balanceNote: { x: 432, y: PAGE_HEIGHT - 231, size: 8.5 }
  }
};

const AGREEMENT_MAP = {
  page1: {
    // Agreement Details Section
    clientName: { x: 155, y: PAGE_HEIGHT - 267 },
    date: { x: 400, y: PAGE_HEIGHT - 267 },
    serviceAddress: { x: 170, y: PAGE_HEIGHT - 307 },
    cityZip: { x: 400, y: PAGE_HEIGHT - 307 },
    phone: { x: 125, y: PAGE_HEIGHT - 347 },
    email: { x: 400, y: PAGE_HEIGHT - 347 },
    serviceType: { x: 155, y: PAGE_HEIGHT - 387 },
    serviceDate: { x: 400, y: PAGE_HEIGHT - 387 },
    estimatedTotal: { x: 165, y: PAGE_HEIGHT - 427 },
    depositAmount: { x: 400, y: PAGE_HEIGHT - 427 },
    frequency: { x: 145, y: PAGE_HEIGHT - 467 },
    assignedCleaner: { x: 415, y: PAGE_HEIGHT - 467 }
  },
  page4: {
      // Signatures area (just in case we want to auto-fill names)
      repName: { x: 86, y: PAGE_HEIGHT - 720, size: 8.5 },
      clientName: { x: 500, y: PAGE_HEIGHT - 720, size: 8.5 },
      clientPhone: { x: 500, y: PAGE_HEIGHT - 750, size: 8.5 }
  }
};

export {
  DOCUMENT_CONFIG,
  PROPOSAL_MAP,
  AGREEMENT_MAP
};
