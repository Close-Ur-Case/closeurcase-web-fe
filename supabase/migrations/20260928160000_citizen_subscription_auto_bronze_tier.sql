-- ==============================================================================
-- Migration: Add plan_tier to public.citizens and auto-set to bronze on expiry
-- ==============================================================================
-- Ensures that every citizen account has a plan_tier column ('bronze', 'silver', 'gold', 'micropass')
-- with a default of 'bronze' (Free Tier).
-- When a citizen's active subscription expires, cancels, or is absent, the account
-- is automatically reset to 'bronze'.

ALTER TABLE IF EXISTS public.citizens
    ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(32) DEFAULT 'bronze' NOT NULL;

-- ------------------------------------------------------------------------------
-- Function & Trigger: Sync citizen plan_tier with subscriptions table
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_citizen_subscription_tier()
RETURNS TRIGGER AS $$
DECLARE
    v_citizen_id VARCHAR(64);
    v_active_plan_id VARCHAR(32);
    v_new_tier VARCHAR(32);
    v_now_iso TEXT;
BEGIN
    v_citizen_id := COALESCE(NEW.citizen_id, OLD.citizen_id);
    IF v_citizen_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_now_iso := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    -- Find the most recent active and unexpired subscription
    SELECT plan_id INTO v_active_plan_id
    FROM public.subscriptions
    WHERE citizen_id = v_citizen_id
      AND status = 'Active'
      AND (
          expires_at IS NULL
          OR expires_at > v_now_iso
          OR expires_at > to_char(NOW(), 'YYYY-MM-DD')
      )
    ORDER BY started_at DESC
    LIMIT 1;

    -- Map plan_id to tier, defaulting to 'bronze' (Free tier)
    IF v_active_plan_id = 'yearly' OR v_active_plan_id = 'gold' THEN
        v_new_tier := 'gold';
    ELSIF v_active_plan_id = 'monthly' OR v_active_plan_id = 'silver' THEN
        v_new_tier := 'silver';
    ELSIF v_active_plan_id = 'daily' OR v_active_plan_id = 'micropass' THEN
        v_new_tier := 'micropass';
    ELSE
        -- Auto-set account to bronze free tier when expired, cancelled, or no plan
        v_new_tier := 'bronze';
    END IF;

    UPDATE public.citizens
    SET plan_tier = v_new_tier,
        updated_at = NOW()
    WHERE id = v_citizen_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_citizen_subscription_tier ON public.subscriptions;
CREATE TRIGGER trg_sync_citizen_subscription_tier
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_citizen_subscription_tier();

-- ------------------------------------------------------------------------------
-- Utility Function: Bulk expire outdated subscriptions and reset tiers to bronze
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_outdated_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_now_iso TEXT;
BEGIN
    v_now_iso := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    WITH updated AS (
        UPDATE public.subscriptions
        SET status = 'Expired'
        WHERE status = 'Active'
          AND expires_at IS NOT NULL
          AND (expires_at <= v_now_iso OR expires_at <= to_char(NOW(), 'YYYY-MM-DD'))
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired_count FROM updated;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;
