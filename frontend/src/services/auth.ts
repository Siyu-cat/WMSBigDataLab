const TOKEN_KEY = 'token';
const USER_KEY = 'user';

interface User {
  id: string;
  username: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAdminLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;

  const user = getUser();
  return user?.role === 'admin';
}

export function logout(): void {
  clearToken();
  window.location.href = '/admin/login';
}