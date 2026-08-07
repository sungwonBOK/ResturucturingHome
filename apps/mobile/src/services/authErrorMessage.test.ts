import { getAuthErrorMessage } from './authErrorMessage';

assertEqual(
  getAuthErrorMessage('login', { message: 'Network request failed' }),
  '인증 서버에 연결할 수 없습니다. 네트워크 또는 Supabase 설정을 확인해주세요.',
  'login network request failure message',
);

assertEqual(
  getAuthErrorMessage('login', { message: 'Invalid login credentials' }),
  '이메일 또는 비밀번호가 올바르지 않습니다.',
  'login invalid credentials message',
);

assertEqual(
  getAuthErrorMessage('signup', { message: 'email rate limit exceeded' }),
  '회원가입에 실패했습니다. email rate limit exceeded',
  'signup server error message keeps Supabase detail',
);

assertEqual(
  getAuthErrorMessage('signup', { message: 'Failed to fetch' }),
  '인증 서버에 연결할 수 없습니다. 네트워크 또는 Supabase 설정을 확인해주세요.',
  'signup fetch failure message',
);

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}
