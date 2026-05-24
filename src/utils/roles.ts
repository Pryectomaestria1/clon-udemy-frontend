type RoleClaimUser = {
  sub?: string;
  ['https://udemyclone.com/roles']?: string[];
};

export type NormalizedRole = 'instructor' | 'student';

const roleStorageKey = (userId: string) => `role_${userId}`;

const normalizeRole = (role: string | null | undefined): NormalizedRole | null => {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'instructor' || normalized === 'student') {
    return normalized;
  }
  return null;
};

export function migrateLegacyRole(userId: string): void {
  const key = roleStorageKey(userId);
  const storedRole = localStorage.getItem(key);
  const normalizedRole = normalizeRole(storedRole);

  if (!storedRole || !normalizedRole) return;

  if (storedRole !== normalizedRole) {
    localStorage.setItem(key, normalizedRole);
  }
}

export function setStoredRole(userId: string, role: string): void {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return;
  localStorage.setItem(roleStorageKey(userId), normalizedRole);
}

export function getInstructorRole(user: RoleClaimUser | null): boolean {
  if (!user) return false;

  if (user.sub) {
    migrateLegacyRole(user.sub);
  }

  const fromClaim = user['https://udemyclone.com/roles']?.some(
    claimRole => normalizeRole(claimRole) === 'instructor',
  );

  if (fromClaim) return true;

  if (!user.sub) return false;

  return normalizeRole(localStorage.getItem(roleStorageKey(user.sub))) === 'instructor';
}
