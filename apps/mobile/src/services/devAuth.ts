import * as SecureStore from 'expo-secure-store';

const DEV_ADMIN_SESSION_KEY = 'restructure.devAdminSession';

export const DEV_ADMIN_EMAIL = process.env.EXPO_PUBLIC_DEV_ADMIN_EMAIL ?? '';
export const DEV_ADMIN_PASSWORD = process.env.EXPO_PUBLIC_DEV_ADMIN_PASSWORD ?? '';

export interface DevAdminSession {
  id: 'dev-admin';
  email: typeof DEV_ADMIN_EMAIL;
  role: 'admin';
}

type DevAuthListener = (session: DevAdminSession | null) => void;

const listeners = new Set<DevAuthListener>();

export function isDevAdminAuthEnabled() {
  return __DEV__ && Boolean(DEV_ADMIN_EMAIL && DEV_ADMIN_PASSWORD);
}

export async function getDevAdminSession(): Promise<DevAdminSession | null> {
  if (!isDevAdminAuthEnabled()) {
    return null;
  }

  const storedSession = await SecureStore.getItemAsync(DEV_ADMIN_SESSION_KEY);
  return storedSession === '1' ? createDevAdminSession() : null;
}

export async function signInDevAdmin(email: string, password: string) {
  if (!isDevAdminAuthEnabled()) {
    return { session: null, error: null };
  }

  if (email.trim().toLowerCase() !== DEV_ADMIN_EMAIL || password !== DEV_ADMIN_PASSWORD) {
    return { session: null, error: '개발용 관리자 계정 정보가 일치하지 않습니다.' };
  }

  const session = createDevAdminSession();
  await SecureStore.setItemAsync(DEV_ADMIN_SESSION_KEY, '1');
  notifyDevAuthListeners(session);

  return { session, error: null };
}

export async function signOutDevAdmin() {
  await SecureStore.deleteItemAsync(DEV_ADMIN_SESSION_KEY);
  notifyDevAuthListeners(null);
}

export function onDevAdminAuthStateChange(listener: DevAuthListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function createDevAdminSession(): DevAdminSession {
  return {
    id: 'dev-admin',
    email: DEV_ADMIN_EMAIL,
    role: 'admin',
  };
}

function notifyDevAuthListeners(session: DevAdminSession | null) {
  listeners.forEach((listener) => listener(session));
}
