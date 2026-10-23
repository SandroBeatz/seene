alter table public.otp_codes
  add column attempts int not null default 0,
  add constraint otp_codes_attempts_non_negative check (attempts >= 0);
