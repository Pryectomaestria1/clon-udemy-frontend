import { describe, expect, it, beforeEach } from 'vitest';
import { getInstructorRole, migrateLegacyRole, setStoredRole } from './roles';

describe('roles utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false for null user', () => {
    expect(getInstructorRole(null)).toBe(false);
  });

  it('returns true for PascalCase Auth0 claim', () => {
    const user = { sub: 'u-1', 'https://udemyclone.com/roles': ['Instructor'] };
    expect(getInstructorRole(user)).toBe(true);
  });

  it('returns true for lowercase claim', () => {
    const user = { sub: 'u-2', 'https://udemyclone.com/roles': ['instructor'] };
    expect(getInstructorRole(user)).toBe(true);
  });

  it('returns false when claim is missing', () => {
    const user = { sub: 'u-3' };
    expect(getInstructorRole(user)).toBe(false);
  });

  it('migrates stored Instructor to instructor and returns true', () => {
    localStorage.setItem('role_u-4', 'Instructor');
    const user = { sub: 'u-4' };

    expect(getInstructorRole(user)).toBe(true);
    expect(localStorage.getItem('role_u-4')).toBe('instructor');
  });

  it('returns true for already lowercase stored role', () => {
    localStorage.setItem('role_u-5', 'instructor');
    const user = { sub: 'u-5' };

    expect(getInstructorRole(user)).toBe(true);
    expect(localStorage.getItem('role_u-5')).toBe('instructor');
  });

  it('returns false if no stored role exists', () => {
    const user = { sub: 'u-6' };
    expect(getInstructorRole(user)).toBe(false);
  });

  it('migrateLegacyRole is idempotent for lowercase values', () => {
    localStorage.setItem('role_u-7', 'instructor');

    migrateLegacyRole('u-7');
    migrateLegacyRole('u-7');

    expect(localStorage.getItem('role_u-7')).toBe('instructor');
  });

  it('migrateLegacyRole ignores empty keys', () => {
    migrateLegacyRole('u-8');
    expect(localStorage.getItem('role_u-8')).toBeNull();
  });

  it('setStoredRole persists canonical lowercase values', () => {
    setStoredRole('u-9', 'Instructor');
    expect(localStorage.getItem('role_u-9')).toBe('instructor');
  });
});
