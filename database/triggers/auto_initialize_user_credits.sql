-- Database trigger to automatically grant 10 free credits on user creation
-- This ensures EVERY new user gets credits, even if the API call fails

CREATE OR REPLACE FUNCTION auto_grant_signup_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Only grant credits if this is a new user (INSERT operation)
    -- Check if user already has credits to prevent duplicates
    IF NOT EXISTS (
        SELECT 1 FROM public.user_credits WHERE user_id = NEW.id
    ) THEN
        -- Grant 10 free credits
        INSERT INTO public.user_credits (
            user_id,
            total_credits,
            remaining_credits,
            used_credits,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            10,
            10,
            0,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Auto-granted 10 free credits to new user: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS trigger_auto_grant_signup_credits ON auth.users;
CREATE TRIGGER trigger_auto_grant_signup_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_signup_credits();

COMMENT ON FUNCTION auto_grant_signup_credits() IS 'Automatically grants 10 free credits to every new user on signup';
COMMENT ON TRIGGER trigger_auto_grant_signup_credits ON auth.users IS 'Ensures every new signup gets 10 free credits immediately';

