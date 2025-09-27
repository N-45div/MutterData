import { auth } from "@/lib/auth";

// Rate limiting configuration
const RATE_LIMITS = {
  // Free tier limits (per hour)
  free: {
    voice_queries: 10,
    ai_insights: 5,
    file_uploads: 1,
  },
  // Starter plan limits (per hour)
  starter: {
    voice_queries: 50,
    ai_insights: 25,
    file_uploads: 5,
  },
  // Pro plan limits (per hour)
  pro: {
    voice_queries: 200,
    ai_insights: 100,
    file_uploads: 20,
  },
  // Business plan limits (per hour)
  business: {
    voice_queries: 1000,
    ai_insights: 500,
    file_uploads: 100,
  },
};

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  plan: string;
}

export async function checkRateLimit(
  userId: string,
  action: 'voice_queries' | 'ai_insights' | 'file_uploads',
  userPlan: 'free' | 'starter' | 'pro' | 'business' = 'free'
): Promise<RateLimitResult> {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  
  // Get current usage
  const current = rateLimitStore.get(key);
  const resetTime = current?.resetTime || now + windowMs;
  
  // Reset if window expired
  if (now > resetTime) {
    rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
  }
  
  const usage = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  const limit = RATE_LIMITS[userPlan][action];
  const remaining = Math.max(0, limit - usage.count);
  
  if (usage.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: usage.resetTime,
      plan: userPlan,
    };
  }
  
  // Increment usage
  rateLimitStore.set(key, {
    count: usage.count + 1,
    resetTime: usage.resetTime,
  });
  
  return {
    allowed: true,
    remaining: remaining - 1,
    resetTime: usage.resetTime,
    plan: userPlan,
  };
}

export function getRateLimitInfo(
  userId: string,
  action: 'voice_queries' | 'ai_insights' | 'file_uploads',
  userPlan: 'free' | 'starter' | 'pro' | 'business' = 'free'
): { used: number; limit: number; remaining: number } {
  const key = `${userId}:${action}`;
  const usage = rateLimitStore.get(key) || { count: 0, resetTime: Date.now() };
  const limit = RATE_LIMITS[userPlan][action];
  
  return {
    used: usage.count,
    limit,
    remaining: Math.max(0, limit - usage.count),
  };
}

// Middleware for API routes
export function withRateLimit(
  action: 'voice_queries' | 'ai_insights' | 'file_uploads'
) {
  return async (req: Request) => {
    try {
      // Get user from session
      const session = await auth.api.getSession({ headers: req.headers });
      
      if (!session?.user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check rate limit (default to free plan for demo)
      const userPlan = 'free'; // In production, get from user's subscription
      const rateLimitResult = await checkRateLimit(session.user.id, action, userPlan);
      
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `You've reached your ${action} limit for the ${userPlan} plan. Upgrade for higher limits!`,
            resetTime: rateLimitResult.resetTime,
            plan: rateLimitResult.plan,
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': RATE_LIMITS[userPlan][action].toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            }
          }
        );
      }
      
      return null; // Allow request to proceed
    } catch (error) {
      console.error('Rate limiting error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Usage tracking for billing
export function trackUsage(
  userId: string,
  action: 'voice_queries' | 'ai_insights' | 'file_uploads',
  amount: number = 1
) {
  // In production, send to Autumn for billing
  console.log(`Usage tracked: ${userId} - ${action}: ${amount}`);
  
  // This would integrate with Autumn's /track endpoint
  // autumn.track({
  //   userId,
  //   feature: action,
  //   usage: amount,
  // });
}
