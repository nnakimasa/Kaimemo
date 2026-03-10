import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { setAuthToken } from '../services/api';

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// PKCE utilities
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ access_token?: string; refresh_token?: string; error?: string }> {
  const redirectUri = `${window.location.origin}/callback`;
  const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: COGNITO_CLIENT_ID,
      code_verifier: codeVerifier,
    }).toString(),
  });
  return response.json();
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token?: string }> {
  const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: COGNITO_CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  });
  return response.json();
}

async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const accessToken = localStorage.getItem('access_token');
      const storedRefresh = localStorage.getItem('refresh_token');

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setAuthToken(accessToken);
      const userData = await fetchCurrentUser(accessToken);

      if (userData) {
        setUser(userData);
      } else if (storedRefresh) {
        // Try token refresh
        try {
          const tokens = await refreshAccessToken(storedRefresh);
          if (tokens.access_token) {
            localStorage.setItem('access_token', tokens.access_token);
            setAuthToken(tokens.access_token);
            const refreshedUser = await fetchCurrentUser(tokens.access_token);
            if (refreshedUser) setUser(refreshedUser);
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setAuthToken(null);
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setAuthToken(null);
        }
      } else {
        localStorage.removeItem('access_token');
        setAuthToken(null);
      }

      setIsLoading(false);
    };

    initialize();
  }, []);

  const login = useCallback(async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('pkce_state', state);

    const url = new URL(`https://${COGNITO_DOMAIN}/oauth2/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', COGNITO_CLIENT_ID);
    url.searchParams.set('redirect_uri', `${window.location.origin}/callback`);
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    window.location.href = url.toString();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthToken(null);
    setUser(null);

    if (COGNITO_DOMAIN && COGNITO_CLIENT_ID) {
      const logoutUrl = new URL(`https://${COGNITO_DOMAIN}/logout`);
      logoutUrl.searchParams.set('client_id', COGNITO_CLIENT_ID);
      logoutUrl.searchParams.set('logout_uri', `${window.location.origin}/login`);
      window.location.href = logoutUrl.toString();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const setTokens = useCallback(
    async (accessToken: string, refreshToken: string | null) => {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      setAuthToken(accessToken);
      const userData = await fetchCurrentUser(accessToken);
      if (userData) setUser(userData);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
