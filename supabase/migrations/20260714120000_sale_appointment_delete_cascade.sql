-- Deleting an appointment now removes its recorded sale too.
--
-- `sale.appointment_id` is NOT NULL UNIQUE (a sale is 1:1 with its appointment),
-- so it can't be orphaned or SET NULL — the only consistent options when the
-- appointment is deleted are RESTRICT (block) or CASCADE (remove the sale). The
-- app deletes appointments as a hard delete, and blocking with a raw FK error is
-- a poor UX, so cascade the sale (sale_item already cascades from sale). The UI
-- warns the master that revenue is removed before confirming the delete.
ALTER TABLE sale DROP CONSTRAINT sale_appointment_id_fkey;

ALTER TABLE sale
  ADD CONSTRAINT sale_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
