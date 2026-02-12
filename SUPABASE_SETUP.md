# Supabase License System Setup Guide

대표님, 라이선스 자물쇠 시스템을 활성화하기 위해 Supabase에서 다음 설정을 진행해 주셔야 합니다.

## 1. 데이터베이스 테이블 생성 (SQL Editor에서 실행)

```sql
-- licenses 테이블 생성 (이미 있으면 건너뜁니다)
create table if not exists licenses (
  id uuid default gen_random_uuid() primary key,
  license_key text unique not null,
  device_id text, -- 활성화된 기기 ID
  is_active boolean default false,
  created_at timestamptz default now(),
  activated_at timestamptz
);

-- RLS 설정 (보안 강화)
alter table licenses enable row level security;

-- 정책 생성 (이미 있는지 확인 후 생성)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'licenses' 
        and policyname = 'Allow public read-only for checks'
    ) then
        create policy "Allow public read-only for checks" on licenses
        for select using (true);
    end if;
end
$$;
```

## 2. 라이선스 키 생성 (테스트용)

SQL Editor에서 아래 쿼리를 실행하여 테스트용 키를 하나 만듭니다.
```sql
insert into licenses (license_key) values ('PRO-TEST-1234-5678');
```

## 3. Edge Function 생성 (Deno CLI 또는 대시보드)

`verify-license`라는 이름의 Edge Function을 생성하고 아래 코드를 업로드합니다.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { licenseKey, deviceId } = await req.json()
    
    // 이 실장의 깐깐한 주석: 여기서 Service Role Key를 사용해야 DB 업데이트가 가능합니다.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. 키 존재 여부 확인
    const { data: license, error } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single()

    if (error || !license) {
      return new Response(JSON.stringify({ success: false, reason: 'INVALID_KEY' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. 이미 활성화된 경우 기기 ID 체크
    if (license.is_active) {
      if (license.device_id === deviceId) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        return new Response(JSON.stringify({ success: false, reason: 'MACHINE_LOCKED' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3. 신규 활성화 (기기 귀속)
    const { error: updateError } = await supabaseClient
      .from('licenses')
      .update({ 
        device_id: deviceId, 
        is_active: true, 
        activated_at: new Date().toISOString() 
      })
      .eq('id', license.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## 4. 환경 변수 입력 (`src/supabase.ts`)

Supabase 대시보드 -> Settings -> API에서 **Project URL**과 **Anon Key**를 복사하여 `src/supabase.ts` 파일에 붙여넣어 주세요.
