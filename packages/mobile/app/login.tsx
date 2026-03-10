import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/authStore';
import { listsApi } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const cognitoDomain = (Constants.expoConfig?.extra?.cognitoDomain as string) || '';
const cognitoClientId = (Constants.expoConfig?.extra?.cognitoClientId as string) || '';

const discovery = {
  authorizationEndpoint: `https://${cognitoDomain}/oauth2/authorize`,
  tokenEndpoint: `https://${cognitoDomain}/oauth2/token`,
};

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'kaimemo' });
console.log('[Auth] redirectUri:', redirectUri);

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, setUser, accessToken } = useAuthStore();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoClientId,
      scopes: ['openid', 'email', 'profile'],
      redirectUri,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (accessToken) {
      router.replace('/');
    }
  }, [accessToken]);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return;

    const { code } = response.params;

    AuthSession.exchangeCodeAsync(
      {
        clientId: cognitoClientId,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      { tokenEndpoint: discovery.tokenEndpoint }
    )
      .then(async (tokenResponse) => {
        await setAuth(
          tokenResponse.accessToken,
          tokenResponse.refreshToken ?? ''
        );
        // Fetch user info from API
        try {
          const me = await fetch(
            `http://${(Constants.expoConfig?.hostUri ?? 'localhost:8081').split(':')[0]}:3000/auth/me`,
            { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } }
          );
          const data = await me.json();
          if (data.data) setUser(data.data);
        } catch {
          // user info fetch is best-effort
        }
        router.replace('/');
      })
      .catch(() => {
        // Stay on login screen on error
      });
  }, [response]);

  if (!cognitoDomain || !cognitoClientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kaimemo</Text>
        <Text style={styles.subtitle}>買い物リスト共有アプリ</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ⚠️ Cognito未設定{'\n'}
            app.json の extra.cognitoDomain と{'\n'}extra.cognitoClientId を設定してください
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kaimemo</Text>
      <Text style={styles.subtitle}>買い物リスト共有アプリ</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          {!request ? (
            <ActivityIndicator color="#555" />
          ) : (
            <Text style={styles.googleButtonText}>Googleでログイン</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.appleButtonText}>Appleでログイン</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notice: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  noticeText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 22,
  },
});
