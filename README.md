# RestructuringHome

핸드폰으로 방을 스캔하거나 촬영한 뒤, 자동으로 방 구조와 가구 배치 초안을 만들고
사용자가 수정한 다음 AI 추천과 2D/3D 배치 결과를 확인하는 모바일 앱입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 앱 | Expo (Bare Workflow) + expo-router + TypeScript |
| 스캔 iOS | Swift + Apple RoomPlan API (커스텀 Expo 모듈) |
| 스캔 Android | Kotlin + ARCore (커스텀 Expo 모듈) |
| 2D 편집기 | @shopify/react-native-skia |
| 3D 렌더링 | @react-three/fiber/native |
| AI 추천 | OpenAI GPT-4o (Supabase Edge Function 경유) |
| 백엔드 | Supabase (Auth + PostgreSQL + Storage) |
| 패키지 관리 | pnpm workspaces |

## 프로젝트 구조

```
RestructuringHome/
├── apps/
│   └── mobile/           # Expo Bare 앱
│       ├── app/          # expo-router 화면
│       ├── src/
│       │   └── theme/    # 색상 토큰 등 디자인 시스템
│       └── modules/      # 네이티브 스캔 모듈 (추후 추가)
├── packages/
│   └── domain/           # 공통 타입 & Room JSON 스키마
├── supabase/
│   ├── functions/        # Edge Functions (OpenAI 프록시 등)
│   └── migrations/       # DB 스키마
├── docs/
│   ├── DOMAIN.md         # 핵심 알고리즘 설명
│   └── progress.md       # 개발 진행 상황
├── pnpm-workspace.yaml   # pnpm 워크스페이스 설정
├── .npmrc                # node-linker=hoisted (RN 호환)
├── setup.md              # 설치/실행 가이드
└── README.md
```

## 시작하기

`setup.md` 참고

