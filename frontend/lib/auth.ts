export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
  forcePasswordChange?: boolean;
}

export function setSession(token: string, user: UserSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('projetox_token', token);
  localStorage.setItem('projetox_user', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('projetox_token');
  localStorage.removeItem('projetox_user');
}

export function getStoredUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('projetox_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as UserSession;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('projetox_token');
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
