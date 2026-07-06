import { describe, expect, it } from 'vitest';
import { originFromUrl } from './url';

describe('originFromUrl', () => {
  it('returns the origin for a valid http url', () => {
    expect(originFromUrl('http://example.com/path?x=1')).toBe('http://example.com');
  });

  it('returns the origin for a valid https url', () => {
    expect(originFromUrl('https://example.com:8443/path')).toBe('https://example.com:8443');
  });

  it('returns null for chrome:// urls', () => {
    expect(originFromUrl('chrome://extensions')).toBeNull();
  });

  it('returns null for about: urls', () => {
    expect(originFromUrl('about:blank')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(originFromUrl(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(originFromUrl('')).toBeNull();
  });

  it('returns null for a malformed url', () => {
    expect(originFromUrl('not a url')).toBeNull();
  });
});
