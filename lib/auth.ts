import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Get current user from server-side (API routes, Server Components)
export async function getServerUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle read-only cookie store
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle read-only cookie store
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Get user ID for API routes
export async function auth(): Promise<{ userId: string | null }> {
  const user = await getServerUser();
  return { userId: user?.id ?? null };
}

// Admin client for server operations
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Get subscription for user
export async function getUserSubscription(userId: string) {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[Auth] Error fetching subscription:', error);
    return null;
  }
  
  return data;
}

// Get credits for user
export async function getUserCredits(userId: string) {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[Auth] Error fetching credits:', error);
    return null;
  }
  
  return data;
}

// Initialize user subscription and credits (only creates if missing, never overwrites)
export async function initializeUserData(userId: string, email?: string) {
  const supabase = getAdminClient();
  
  // Create/update profile (upsert is fine for profile - we want to update name/avatar)
  await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  
  // Check if subscription exists before creating
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingSub) {
    await supabase
      .from('user_subscriptions')
      .insert({
        id: userId,
        tier: 'starter',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
  }
  
  // Check if credits exist before creating
  const { data: existingCredits } = await supabase
    .from('user_credits')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingCredits) {
    await supabase
      .from('user_credits')
      .insert({
        id: userId,
        total_credits: 50,
        used_credits: 0,
        bonus_credits: 0,
        last_reset_at: new Date().toISOString()
      });
  }
}

// Deduct credits
export async function deductCredits(userId: string, amount: number, description: string) {
  const supabase = getAdminClient();
  
  // Get current credits
  const { data: credits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (fetchError || !credits) {
    console.error('[Credits] Error fetching credits:', fetchError);
    throw new Error('Could not fetch credits');
  }
  
  const remaining = credits.total_credits - credits.used_credits + credits.bonus_credits;
  
  if (remaining < amount) {
    throw new Error(`Insufficient credits. Need ${amount}, have ${remaining}`);
  }
  
  // Update credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      used_credits: credits.used_credits + amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (updateError) {
    console.error('[Credits] Error updating credits:', updateError);
    throw new Error('Could not update credits');
  }
  
  // Log transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type: 'usage',
      description
    });
  
  return { success: true, remaining: remaining - amount };
}
