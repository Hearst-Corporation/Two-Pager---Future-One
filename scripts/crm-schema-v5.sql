-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA v5
-- Adds parallel status-change audit triggers for partners and initiatives.
-- Operators already had this since v1.
-- =====================================================================

-- ---- PARTNERS ----
create or replace function crm.log_partner_status_change() returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into crm.activity_log (operator_id, field, old_value, new_value)
    values (null, 'partner.status', old.status::text, new.status::text);
    insert into crm.events (operator_id, partner_id, type, subject, body)
    values (null, new.id, 'status_change', 'Status changed',
            old.status::text || ' → ' || new.status::text);
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists partners_status_log on crm.partners;
create trigger partners_status_log
  after update on crm.partners
  for each row execute function crm.log_partner_status_change();

-- ---- INITIATIVES ----
create or replace function crm.log_initiative_status_change() returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into crm.activity_log (operator_id, field, old_value, new_value)
    values (null, 'initiative.status:' || new.id::text, old.status::text, new.status::text);
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists initiatives_status_log on crm.initiatives;
create trigger initiatives_status_log
  after update on crm.initiatives
  for each row execute function crm.log_initiative_status_change();
