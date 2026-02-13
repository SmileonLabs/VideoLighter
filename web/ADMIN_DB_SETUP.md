# Admin + DB Setup

## What Was Added
- DB migration:
  - `supabase/migrations/20260213_admin_license_usage_schema.sql`
- Admin page route:
  - `/admin`
- Admin page source:
  - `src/pages/AdminPage.tsx`
- Updated webhook:
  - `supabase/functions/polar-webhook/index.ts`

## Core DB Objects
- `admin_users`: 관리자 이메일 allowlist
- `profiles`: 사용자 이메일/기본 정보
- `licenses`: 기존 테이블 확장 (`expires_at`, `device_limit`, `user_email`, `polar_*`)
- `devices`: 기기 fingerprint 저장
- `license_activations`: 라이선스-기기 활성 연결 (활성 1:1 제약)
- `compression_jobs`: 상세 사용 로그 (30일 보관 대상)
- `license_usage_stats`: 영구 집계 통계

## Key Policies
- 관리자 판별 함수: `public.is_admin()` (JWT email 기반)
- `contact@smileon.app` 기본 관리자 seed
- RLS:
  - 사용자 본인 데이터 접근
  - 관리자는 전체 조회/관리

## Product Rules Covered
- Free tier: 라이선스 없이 사용 가능(앱에서 일일 3개 제한 처리)
- Monthly: 웹훅에서 `expires_at = now() + 31 days`
- Lifetime: 웹훅에서 `expires_at = 9999-12-31`
- Paid license: 활성 기기 1대 제한
- 기기 초기화: `/admin`에서 활성화 해제 가능
- 환불 판단: `compression_jobs` + `license_usage_stats` 확인 가능

## Apply Steps
1. Supabase SQL Editor에서 migration SQL 실행
2. Edge Function 재배포 (`polar-webhook`)
3. 웹 앱 배포 후 `/admin` 접속
4. `contact@smileon.app` 계정으로 로그인해 관리자 콘솔 사용

## Recommended Next App API Endpoints (Desktop)
- `POST /license/activate`:
  - 입력: `license_key`, `device_fingerprint`, `os_name`, `app_version`
  - 동작: 활성화 제약 검사 + `license_activations` upsert
- `POST /usage/job`:
  - 입력: job 결과/용량
  - 동작: `compression_jobs` insert (trigger로 집계 반영)
- `POST /license/verify`:
  - 동작: 만료/상태 확인 + 오프라인 grace (권장 7일)
