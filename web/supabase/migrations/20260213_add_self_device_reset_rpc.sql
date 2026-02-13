create or replace function public.request_device_reset(cooldown_days integer default 14)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_license public.licenses%rowtype;
  v_last_reset timestamptz;
  v_next_available_at timestamptz;
  v_deactivated_count integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  select l.*
  into v_license
  from public.licenses l
  where l.user_id = v_uid
    and l.status = 'active'
    and coalesce(l.expires_at, now() + interval '100 years') > now()
  order by
    case
      when l.expires_at is not null and l.expires_at >= '9999-01-01T00:00:00Z'::timestamptz then 1
      else 0
    end desc,
    l.expires_at desc nulls last,
    l.created_at desc
  limit 1;

  if v_license.id is null then
    return jsonb_build_object('ok', false, 'code', 'no_active_license');
  end if;

  select max(la.deactivated_at)
  into v_last_reset
  from public.license_activations la
  where la.license_id = v_license.id
    and la.deactivated_reason = 'self_reset'
    and la.deactivated_at is not null;

  if v_last_reset is not null then
    v_next_available_at := v_last_reset + make_interval(days => cooldown_days);
    if now() < v_next_available_at then
      return jsonb_build_object(
        'ok', false,
        'code', 'cooldown',
        'next_available_at', v_next_available_at
      );
    end if;
  end if;

  update public.license_activations
  set
    deactivated_at = now(),
    deactivated_reason = 'self_reset'
  where license_id = v_license.id
    and deactivated_at is null;

  get diagnostics v_deactivated_count = row_count;

  if v_deactivated_count = 0 then
    return jsonb_build_object('ok', false, 'code', 'no_active_device');
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'reset_done',
    'deactivated_count', v_deactivated_count,
    'next_available_at', now() + make_interval(days => cooldown_days)
  );
end;
$$;

grant execute on function public.request_device_reset(integer) to authenticated;
