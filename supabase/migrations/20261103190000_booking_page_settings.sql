-- "Онлайн-запись": what clients can do and see on the booking page. All on by default:
-- moving and prices already work that way, and the design has the comment on.
-- "Спрашивать имя" gets no column: a new client's name is required to create the client,
-- and a returning client isn't asked.

ALTER TABLE public.master_settings
  ADD COLUMN allow_client_reschedule boolean NOT NULL DEFAULT true,
  ADD COLUMN booking_show_prices boolean NOT NULL DEFAULT true,
  ADD COLUMN booking_allow_comment boolean NOT NULL DEFAULT true;
