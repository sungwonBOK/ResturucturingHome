import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/services/supabase';
import { colors } from '../../src/theme/colors';
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_PASSWORD,
  isDevAdminAuthEnabled,
  signInDevAdmin,
} from '../../src/services/devAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const devAdminAuthEnabled = isDevAdminAuthEnabled();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const devAdminResult = await signInDevAdmin(email, password);

      if (devAdminResult.session) {
        router.replace('/(main)/home');
        return;
      }

      if (devAdminResult.error && email.trim().toLowerCase() === DEV_ADMIN_EMAIL) {
        setError(devAdminResult.error);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.replace('/(main)/home');
      }
    } catch (error) {
      console.warn('Login request failed.', error);
      setError('인증 서버에 연결할 수 없습니다. 개발 중이면 관리자 계정으로 우회 로그인할 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevAdminLogin = async () => {
    setEmail(DEV_ADMIN_EMAIL);
    setPassword(DEV_ADMIN_PASSWORD);
    setError('');
    setLoading(true);

    try {
      const { session, error } = await signInDevAdmin(DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD);

      if (session) {
        router.replace('/(main)/home');
      } else if (error) {
        setError(error);
      }
    } catch (error) {
      console.warn('Dev admin login failed.', error);
      setError('개발용 관리자 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.logoArea}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoMark}
          />
          <Text style={styles.appName}>ReStructure</Text>
          <Text style={styles.tagline}>AI 가구 배치 추천 서비스</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>로그인</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>로그인</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {devAdminAuthEnabled ? (
            <TouchableOpacity
              style={styles.devAdminBtn}
              onPress={handleDevAdminLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.devAdminBtnText}>개발용 관리자 로그인</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>계정이 없으신가요? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>회원가입</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoMark: { width: 52, height: 52, borderRadius: 16, marginBottom: 14 },
  appName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.error,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  btn: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  devAdminBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  devAdminBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});
