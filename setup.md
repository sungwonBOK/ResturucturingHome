# 설치 및 실행 가이드

## 필수 요구사항
- Node.js 18+
- pnpm 10+
- Xcode (iOS 빌드, macOS 전용)
- Android Studio (Android 빌드)

## 초기 설치

```bash
# 루트에서 실행
pnpm install
```

## 앱 실행

```bash
# Expo 개발 서버
pnpm mobile

# iOS 시뮬레이터
pnpm --filter mobile ios

# Android 에뮬레이터
pnpm --filter mobile android
```

## 환경 변수

`apps/mobile/.env` 파일 생성 후 아래 값 입력:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

`supabase/` 디렉토리에서 Edge Function 관련 설정 확인.
