-- @last-edited: 2026-11-18 UTC+7.
-- @title: rename dark and private schemas - the private namespaces now speak Navego.
-- @state: renames opera_agent_tx_candidate and opera_agent_private to navego_* forms by moving every object; all function definitions that reference the old schema names are recreated with the new names.
-- @dependencies: 20260913143306_transaction_journal_8d_dark.sql, 20260911162525_navego_goal_head.sql, 20260914043049_transaction_operator_fence_8d.sql.

CREATE SCHEMA navego_tx_candidate;
CREATE SCHEMA navego_private;

ALTER TABLE opera_agent_tx_candidate.acceptance_bindings SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.approvals SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.commit_slots SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.journal SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.operator_control SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.policy SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.principals SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.rates SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.run_challenges SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.run_identities SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.run_limits SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.run_previews SET SCHEMA navego_tx_candidate;
ALTER TABLE opera_agent_tx_candidate.runs SET SCHEMA navego_tx_candidate;

ALTER TABLE opera_agent_private.goal_heads SET SCHEMA navego_private;
ALTER TABLE opera_agent_private.vm_effects SET SCHEMA navego_private;
ALTER TABLE opera_agent_private.vm_rate_windows SET SCHEMA navego_private;
ALTER TABLE opera_agent_private.vm_runs SET SCHEMA navego_private;

ALTER FUNCTION opera_agent_tx_candidate.binding_immutable() SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.canonical_metadata(jsonb, integer) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.cleanup(integer) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.metadata_digest(jsonb) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.preview_digest(jsonb) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.snapshot(navego_tx_candidate.runs, boolean) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.tx_limit(text, text, text, integer) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.read_run(text, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.prepare(text, text, text, text, text, text, text, bigint, text, timestamp with time zone, timestamp with time zone) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.mark_validated(text, text, text, integer, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.reserve_slot(text, text, text, integer, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.claim(text, text, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.await_approval(text, text, text, integer, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.issue_approval(text, text, text, integer, text, text, text, integer) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.consume_approval(text, text, text, integer, text, text, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.mark_validated(text, text, text, integer, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.finalize_dark(text, text, text, integer, text, text, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.cancel(text, text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.assert_dark(text, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.assert_lease(navego_tx_candidate.runs, integer, text) SET SCHEMA navego_tx_candidate;
ALTER FUNCTION opera_agent_tx_candidate.assert_live_identity(text, text, jsonb) SET SCHEMA navego_tx_candidate;

-- Recreate every function that references the old schema names, with the new ones in place.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE position('opera_agent_tx_candidate' in p.prosrc) > 0 OR position('opera_agent_private' in p.prosrc) > 0
  LOOP
    EXECUTE replace(replace(r.def, 'opera_agent_tx_candidate', 'navego_tx_candidate'),
                      'opera_agent_private', 'navego_private');
  END LOOP;
END $$;

DROP SCHEMA opera_agent_tx_candidate;
DROP SCHEMA opera_agent_private;