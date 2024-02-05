import { describe, it, expect } from 'vitest';
import { validateNpmName } from "../../src/helpers/validate-pkg";

describe('validateNpmName', () => {
  it('returns valid for a valid package name', () => {
    const result = validateNpmName('valid-package-name');
    expect(result).toEqual({ valid: true });
  });

  it('returns invalid with problems for an invalid package name', () => {
    const result = validateNpmName('_invalidPackageName');
    if (!result.valid) {
      expect(result.problems).toBeDefined();
      expect(result.problems.length).toBeGreaterThan(0);
    } else {
      // This line is for ensuring the test fails if the result is unexpectedly valid
      expect(result.valid).toBe(false);
    }
  });

  it('handles names that are not valid for new packages but valid for old', () => {
    const result = validateNpmName('node_modules');
    if (!result.valid) {
      expect(result.problems).toBeDefined();
      expect(result.problems.length).toBeGreaterThan(0);
    } else {
      // Ensure the test fails if the result is unexpectedly valid
      expect(result.valid).toBe(false);
    }
  });
});
