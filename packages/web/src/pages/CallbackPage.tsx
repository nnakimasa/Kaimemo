import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, exchangeCodeForTokens } from '../auth/AuthContext';

export default function CallbackPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);

    const error = params.get('error');
    const errorDescription = params.get('error_description');
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      navigate(`/login?error=${encodeURIComponent(errorDescription ?? error)}`);
      return;
    }

    const code = params.get('code');
    const state = params.get('state');
    const storedState = sessionStorage.getItem('pkce_state');
    const codeVerifier = sessionStorage.getItem('pkce_verifier');

    if (!code || !codeVerifier) {
      navigate('/login');
      return;
    }

    // CSRF check
    if (state && storedState && state !== storedState) {
      navigate('/login');
      return;
    }

    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('pkce_state');

    exchangeCodeForTokens(code, codeVerifier)
      .then(async (tokens) => {
        if (tokens.access_token) {
          await setTokens(tokens.access_token, tokens.refresh_token ?? null);
          navigate('/');
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'));
  }, [setTokens, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">ログイン処理中...</p>
      </div>
    </div>
  );
}
