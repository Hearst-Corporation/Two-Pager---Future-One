-- ============================================================
-- hearst-advisor-conversations.sql
-- Project  : future-one (Supabase project ID: zrvlmhuymhyrzonnihce)
-- Schema   : crm
-- Generated: 2026-05-13
--
-- Persists HEARST Advisor chat history (Claude Opus 4.7).
-- One row per conversation thread; messages stored as jsonb
-- array of { role, content } in the Anthropic Messages API shape.
-- ============================================================

CREATE TABLE IF NOT EXISTS crm.hearst_advisor_conversations (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id          uuid        NOT NULL,
    actor_id            uuid,
    title               text,
    messages            jsonb       NOT NULL DEFAULT '[]'::jsonb,
    tools_used          jsonb                DEFAULT '{}'::jsonb,
    started_at          timestamptz NOT NULL DEFAULT now(),
    last_message_at     timestamptz NOT NULL DEFAULT now(),
    ended_at            timestamptz,

    CONSTRAINT hearst_advisor_conversations_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_advisor_conversations_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id) ON DELETE CASCADE,
    CONSTRAINT hearst_advisor_conversations_actor_id_fkey
        FOREIGN KEY (actor_id) REFERENCES crm.profiles(id)
);

CREATE INDEX IF NOT EXISTS hearst_advisor_conversations_project_id_idx
    ON crm.hearst_advisor_conversations (project_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS hearst_advisor_conversations_actor_id_idx
    ON crm.hearst_advisor_conversations (actor_id, last_message_at DESC);

-- End of hearst-advisor-conversations.sql
