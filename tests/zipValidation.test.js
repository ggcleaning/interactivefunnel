import { describe, it, expect } from 'vitest';
import { qualifyServiceZip } from '../src/utils/zipValidation.js';

describe('Strict Canonical ZIP Qualification Engine', () => {
  it('should accept valid Nassau County ZIP code (11530 Garden City)', () => {
    const result = qualifyServiceZip('11530');
    expect(result.status).toBe('ELIGIBLE');
    expect(result.isServiceable).toBe(true);
    expect(result.county).toBe('Nassau');
    expect(result.marketArea).toBe('Garden City');
    expect(result.internalReason).toBeNull();
  });

  it('should accept valid Suffolk County ZIP code (11743 Huntington)', () => {
    const result = qualifyServiceZip('11743');
    expect(result.status).toBe('ELIGIBLE');
    expect(result.isServiceable).toBe(true);
    expect(result.county).toBe('Suffolk');
    expect(result.marketArea).toBe('Huntington');
    expect(result.internalReason).toBeNull();
  });

  it('should accept valid 9-digit ZIP+4 hyphenated format (11530-1234)', () => {
    const result = qualifyServiceZip('11530-1234');
    expect(result.normalizedZip).toBe('11530');
    expect(result.status).toBe('ELIGIBLE');
    expect(result.isServiceable).toBe(true);
  });

  it('should normalize leading and trailing whitespace only', () => {
    const result = qualifyServiceZip('   11787   ');
    expect(result.normalizedZip).toBe('11787');
    expect(result.status).toBe('ELIGIBLE');
    expect(result.county).toBe('Suffolk');
  });

  it('should reject internal whitespace (115 30)', () => {
    const result = qualifyServiceZip('115 30');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
    expect(result.isServiceable).toBe(false);
  });

  it('should reject letters in ZIP code (1153a)', () => {
    const result = qualifyServiceZip('1153a');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
  });

  it('should reject partial ZIP code (115)', () => {
    const result = qualifyServiceZip('115');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
  });

  it('should reject arbitrary punctuation (11530!)', () => {
    const result = qualifyServiceZip('11530!');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
  });

  it('should reject malformed unhyphenated 9-digit strings (115301234)', () => {
    const result = qualifyServiceZip('115301234');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
  });

  it('should reject malformed 9-digit hyphenated strings (11530-12)', () => {
    const result = qualifyServiceZip('11530-12');
    expect(result.status).toBe('INVALID_ZIP');
    expect(result.internalReason).toBe('MALFORMED');
  });

  it('should reject missing, empty, or null ZIPs', () => {
    expect(qualifyServiceZip('').status).toBe('INVALID_ZIP');
    expect(qualifyServiceZip(null).status).toBe('INVALID_ZIP');
    expect(qualifyServiceZip(undefined).status).toBe('INVALID_ZIP');
  });

  it('should reject out-of-county NYC Queens ZIP (11375)', () => {
    const result = qualifyServiceZip('11375');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.isServiceable).toBe(false);
    expect(result.internalReason).toBe('OUT_OF_COUNTY');
  });

  it('should reject out-of-county Brooklyn ZIP (11201)', () => {
    const result = qualifyServiceZip('11201');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.internalReason).toBe('OUT_OF_COUNTY');
  });

  it('should reject out-of-county Westchester ZIP (10601)', () => {
    const result = qualifyServiceZip('10601');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.internalReason).toBe('OUT_OF_COUNTY');
  });

  it('should reject out-of-state California ZIP (90210)', () => {
    const result = qualifyServiceZip('90210');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.internalReason).toBe('OUT_OF_STATE');
  });

  it('should reject out-of-state Florida ZIP (33101)', () => {
    const result = qualifyServiceZip('33101');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.internalReason).toBe('OUT_OF_STATE');
  });

  it('should NEVER allow preferred_area parameter to override ZIP eligibility', () => {
    const result = qualifyServiceZip('90210', 'Garden City');
    expect(result.status).toBe('OUTSIDE_SERVICE_AREA');
    expect(result.isServiceable).toBe(false);
  });
});
