# Web Supabase/Polar 통신 정리

## 범위
- 이 문서는 `web/` 기준으로 **Supabase** 및 **Polar** 관련 통신을 정리합니다.
- 확인 대상:
- `web/src/*`
- `web/supabase/functions/polar-webhook/index.ts`
- `web/.env`

## 1. Supabase 통신

### 1.1 Supabase 클라이언트 초기화
- 파일: `src/lib/supabase.ts`
- `@supabase/supabase-js`의 `createClient(...)` 사용.
- 클라이언트 환경변수:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 1.2 인증 통신 (Supabase Auth)
- 파일: `src/hooks/useAuth.tsx`
- `supabase.auth.getSession()`
- 목적: 앱 로딩 시 기존 로그인 세션 복원
- `supabase.auth.onAuthStateChange(...)`
- 목적: 로그인/로그아웃/세션 변경 이벤트 구독
- `supabase.auth.signInWithOAuth({ provider: 'google', ... })`
- 목적: Google OAuth 로그인
- 리다이렉트: `window.location.origin`
- `supabase.auth.signOut()`
- 목적: 현재 사용자 로그아웃

### 1.3 DB 조회 통신 (`licenses`)
- 파일: `src/pages/Home.tsx`
- 쿼리:
- `from('licenses').select('id').eq('user_id', user?.id).limit(1)`
- 목적: 로그인 사용자가 라이선스를 이미 보유했는지 확인

- 파일: `src/pages/MyPage.tsx`
- 쿼리:
- `from('licenses').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })`
- 목적: 대시보드에 라이선스 목록을 보여주고 플랜/만료 UI 계산에 사용

### 1.4 Supabase Edge Function (서버 측, 서비스 롤)
- 파일: `supabase/functions/polar-webhook/index.ts`
- 런타임 환경변수:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- 서버 측 DB 접근:
- `from('profiles').select('id').eq('email', email).single()`
- `from('licenses').insert({...})`
- 목적: Polar에서 구매/주문 웹훅이 오면 구매자와 프로필을 매칭하고 라이선스 행 생성

## 2. Polar 통신

### 2.1 프론트엔드의 Polar 연동 방식
- **프론트엔드에서 Polar API를 직접 호출하지는 않습니다.**
- 현재는 리다이렉트/외부 링크 방식입니다.

- 파일: `src/pages/Home.tsx`
- 체크아웃 URL 환경변수:
- `VITE_POLAR_MONTHLY_URL`
- `VITE_POLAR_CHECKOUT_URL`
- 동작:
- `customer_email` 쿼리 파라미터를 붙여 체크아웃 URL 생성
- `window.location.href = finalUrl`로 이동

- 파일: `src/pages/MyPage.tsx`
- 업그레이드/결제 시 동일한 체크아웃 리다이렉트 로직 사용
- 구매 내역 페이지 이동:
- `window.open('https://polar.sh/purchases', '_blank')`

### 2.2 Polar -> Supabase 서버 콜백 (웹훅)
- 파일: `supabase/functions/polar-webhook/index.ts`
- 처리 이벤트 타입:
- `order.created`
- `purchase.created`
- 주요 흐름:
1. 웹훅 payload 파싱
2. 구매자 이메일 추출
3. 이메일로 `profiles` 조회
4. 라이선스 키 생성
5. `licenses` 테이블 insert
6. JSON 응답 반환

## 3. End-to-End 흐름 (현재 구현 기준)

1. 사용자가 Supabase Auth로 Google 로그인 (`useAuth.tsx`)
2. 사용자가 `Home` 또는 `MyPage`에서 유료 플랜 클릭
3. 프론트엔드가 Polar 체크아웃 URL로 리다이렉트 (`customer_email` 포함)
4. 결제 후 Polar가 Supabase Edge Function(`polar-webhook`)으로 웹훅 전송
5. Edge Function이 Supabase `licenses`에 라이선스 데이터 저장
6. 이후 프론트엔드가 `licenses`를 다시 조회해 구매 상태 UI 반영

## 4. 사용 환경변수

### 클라이언트 (`VITE_*`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_POLAR_CHECKOUT_URL`
- `VITE_POLAR_MONTHLY_URL`
- `VITE_DOWNLOAD_URL`

### 서버/함수
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### `web/.env`에 존재하지만, 확인한 프론트 코드에서 직접 사용하지 않는 값
- `POLAR_ACCESS_TOKEN`
- `POLAR_PRODUCT_LIFETIME_ID`
- `POLAR_PRODUCT_PRO_ID`
- `VITE_GOOGLE_CLIENT_ID`

## 5. 참고 사항 (현재 구현 특성)

- 프론트엔드 Polar 연동은 현재 **URL 리다이렉트 방식**입니다. (SDK/API 직접 호출 아님)
- UI에서 결제 완료 상태가 보이려면 웹훅이 정상 처리되어 `licenses`에 데이터가 저장되어야 합니다.
- 현재 웹훅 코드에서는 `product_type`이 `'lifetime'`으로 고정 insert되며, 상품 타입 분기 로직은 아직 없습니다.
