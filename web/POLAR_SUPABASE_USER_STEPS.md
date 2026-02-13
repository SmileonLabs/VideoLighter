# Polar + Supabase 설정: 사용자만 해야 하는 작업

아래는 **대시보드(웹 콘솔)에서 직접 해야 하는 것만** 정리한 순서입니다.

## 1) Polar Webhook 엔드포인트 정리
1. Polar 대시보드 > Webhooks로 이동
2. 엔드포인트를 **1개만 남김**
3. 남길 URL:
`https://almihtbknfluzlccuszp.supabase.co/functions/v1/polar-webhook`
4. 같은 URL 중복 항목/기존 URL(`videolighter.smileon.app/...`)은 삭제

## 2) Polar 이벤트 선택
1. 남긴 엔드포인트의 이벤트 설정 열기
2. 체크:
- `order.paid` (필수)
- `order.refunded` (권장)
3. `order.created`는 체크 해제

## 3) Supabase Edge Function 시크릿 등록
1. Supabase 대시보드 > Edge Functions > `polar-webhook` > Secrets
2. 아래 2개 추가/확인:
- `POLAR_PRODUCT_PRO_ID` = Polar 월간 상품 ID
- `POLAR_PRODUCT_LIFETIME_ID` = Polar 평생 상품 ID

## 3-1) 구매내역 상세보기용 고객 포탈 세션(서버 생성)
- 프론트에서 고정 URL을 쓰지 않고, Edge Function이 사용자별 `customer_session_token` URL을 생성합니다.
- Supabase Edge Function Secret에 아래 값이 있어야 합니다:
  - `POLAR_ACCESS_TOKEN` (Organization Access Token)

## 4) 함수 배포(로컬 터미널)
프로젝트 루트에서 실행:
```bash
supabase functions deploy polar-webhook
```

## 5) 실제 연결 테스트
1. Polar Webhooks에서 `order.paid` 테스트 이벤트 전송
2. Supabase > Table Editor > `licenses` 확인
- `polar_order_id`가 들어왔는지
- `status='active'`인지
- `product_type`/`expires_at`이 맞는지
3. Polar에서 `order.refunded` 테스트 전송
4. `licenses.status='refunded'`로 바뀌는지 확인

## 6) (중요) 앱 사용자 테스트
1. 테스트용 계정으로 웹 로그인
2. 결제 진행
3. 데스크탑 앱에서 라이선스 등록 시도
4. 만료/환불 상태가 앱에 반영되는지 확인

---

## 자주 막히는 포인트
- `User not found`:
  해당 이메일이 Supabase `profiles`에 먼저 있어야 함(웹 로그인 1회 필요).
- 이벤트는 오는데 DB 반영 안 됨:
  `POLAR_PRODUCT_*` 시크릿 값(상품 ID) 오타 확인.
- 중복 라이선스:
  Webhook 엔드포인트 중복 등록 여부 재확인.
