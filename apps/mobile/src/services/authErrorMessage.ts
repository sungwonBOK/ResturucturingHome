type AuthAction = 'login' | 'signup';

interface AuthErrorLike {
  message?: string;
}

const NETWORK_ERROR_MESSAGE =
  '인증 서버에 연결할 수 없습니다. 네트워크 또는 Supabase 설정을 확인해주세요.';

export function getAuthErrorMessage(action: AuthAction, error: AuthErrorLike) {
  const message = error.message?.trim() ?? '';

  if (isNetworkErrorMessage(message)) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (action === 'login') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  return `회원가입에 실패했습니다. ${message || '잠시 후 다시 시도해주세요.'}`;
}

function isNetworkErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('network request failed') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('load failed')
  );
}
