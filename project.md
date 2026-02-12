# VideoLighter

## 서비스 개요
- **서비스 명**: VideoLighter
- **형태**: 데스크탑 애플리케이션 (Tauri)
- **주요 기능**: 비디오 파일 압축 (FFmpeg 기반 고효율 압축)

## 기술 스택
- **Frontend**: React (Vite + TypeScript)
- **Desktop Framework**: Tauri (Rust)
- **Backend/DB**: Supabase (Auth, Database, Edge Functions)
- **Payment**: Polar (License management)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 아키텍처 및 데이터 흐름
1. **인증**: Supabase Auth (Google OAuth) 사용.
2. **결제**: Polar Checkout 연동. 유저 기반 결제 유도.
3. **라이센스 발급**: Polar Webhook -> Supabase Edge Function (`polar-webhook`) -> `licenses` 테이블 삽입.
4. **마이페이지**: Supabase Realtime/Query를 통해 유저의 `licenses` 정보를 즉시 화면에 노출.
5. **보안 (Post-MVP)**: 기기 고유 ID(Machine ID)와 라이센스 키 결합 인증 레이어 적용 예정.

## 히스토리
- 2026-02-12: 서비스 정의 및 `project.md` 생성 (이도도 실장)
- 2026-02-12: 웹 서비스 요구사항 정의 (React, Supabase, Polar) (이도도 실장)
- 2026-02-12: 웹 서비스 인프라 및 UI/UX 핵심 기능 구현 완료 (이도도 실장)
- 2026-02-12: `videolighter_desktop_design` 기반 데스크탑 앱 UI 재작업 완료 (이도도 실장)
  - Lucide React 도입, 라이트/다크 모드 범용 디자인 적용
  - 한국어/영어 다국어 지원 시스템 구축
  - Header, Sidebar, SettingsPanel, BottomBar 구조 개편 및 빌드 검증 완료
- 2026-02-12: 앱 아이덴티티 및 아이콘 세팅 완료 (이도도 실장)
  - 제공된 로고(`VideoLighter_logo_white_500.png`) 기반으로 Tauri 앱 아이콘 세트 생성
  - `tauri.conf.json` 및 `Cargo.toml` 내 제품명(VideoLighter), 식별자(com.smileon.videolighter) 설정 완료
- 2026-02-12: FFmpeg 엔진 통합 및 SVT-AV1 코덱 세팅 완료 (이도도 실장)
  - `ffmpeg-master-latest-win64-gpl` (BtbN) 빌드 다운로드 및 `src-tauri/bin` 이식
  - `libsvtav1` 코덱 지원 확인 및 앱 기본 인코더로 설정 (Hardware 가속보다 우선순위 높임)
  - `lib.ts` 인코더 감지 로직 및 압축 파이프라인 구현 완료
