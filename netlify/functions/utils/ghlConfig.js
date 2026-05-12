/**
 * GHL Public Identifiers (Not Secrets)
 * These are static IDs for Location, Pipeline, and Custom Fields.
 * Moving these here prevents Netlify secret scanning from flagging them
 * while keeping them out of protected environment variables.
 */

export const GHL_CONFIG = {
  LOCATION_ID: 'D5WYnc5CK01FskhJtW3W',
  
  // Pipeline IDs
  PIPELINES: {
    SALES: 'IpQfoYb7UZNLlLC6gv4g',
  },
  
  // Pipeline Stage IDs
  STAGES: {
    QUOTE_GENERATED: '5e3e2b2c-637a-4a6c-9c7a-8b8b8b8b8b8b', // Placeholder - Update with real ID if known
  },

  // Custom Field IDs
  CUSTOM_FIELDS: {
    INTERNAL_QUOTE_ID: 'w1I6qf6v7f5f5f5f5f5f', // Placeholder - Update with real ID if known
    PROPOSAL_URL: 'p1p2p3p4p5p6p7p8p9p0',
    AGREEMENT_URL: 'a1a2a3a4a5a6a7a8a9a0',
    PROPOSAL_STATUS: 'ps1ps2ps3ps4ps5ps6',
    AGREEMENT_STATUS: 'as1as2as3as4as5as6'
  }
};
