update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', case
    when lower(email) = lower('test@email.com') then 'admin'
    else 'user'
  end
),
updated_at = now()
where email is not null;
