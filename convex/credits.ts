import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Credit Plans Configuration
const CREDIT_PLANS = {
  free: {
    name: "Free Plan",
    credits: 100, // 100 credits per month
    price: 0,
    features: ["Basic voice queries", "Email reports", "File uploads"]
  },
  starter: {
    name: "Starter Plan", 
    credits: 1000, // 1000 credits per month
    price: 9.99,
    features: ["Advanced analytics", "Priority support", "Export reports"]
  },
  pro: {
    name: "Pro Plan",
    credits: 5000, // 5000 credits per month  
    price: 29.99,
    features: ["Team collaboration", "Custom integrations", "Advanced AI"]
  },
  business: {
    name: "Business Plan",
    credits: 25000, // 25000 credits per month
    price: 99.99,
    features: ["White label", "Enterprise support", "Custom features"]
  }
};

// Credit Costs for Different Actions
const CREDIT_COSTS = {
  voice_query: 1,      // 1 credit per voice query
  ai_insight: 2,       // 2 credits per AI insight
  file_upload: 5,      // 5 credits per file upload
  email_report: 3,     // 3 credits per email report
  chart_generation: 2, // 2 credits per chart
  mastra_pipeline: 10  // 10 credits for advanced AI pipeline
};

// Initialize credits for new user
export const initializeCredits = mutation({
  args: { 
    userId: v.string(), 
    email: v.string(),
    plan: v.optional(v.string())
  },
  handler: async (ctx, { userId, email, plan = "free" }) => {
    // Check if credits already exist
    const existing = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing;
    }

    const planConfig = CREDIT_PLANS[plan as keyof typeof CREDIT_PLANS] || CREDIT_PLANS.free;
    const now = Date.now();
    const resetDate = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    return await ctx.db.insert("credits", {
      userId,
      email,
      plan,
      credits: planConfig.credits,
      totalCredits: planConfig.credits,
      usedCredits: 0,
      resetDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get user credits
export const getUserCredits = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      return null;
    }

    // Check if credits need to be reset (monthly)
    const now = Date.now();
    if (now > credits.resetDate) {
      // Credits should be reset - this will be handled by a cron job or manual reset
      return {
        ...credits,
        needsReset: true
      };
    }

    return credits;
  },
});

// Check if user has enough credits for an action
export const checkCredits = query({
  args: { 
    userId: v.string(), 
    action: v.string() 
  },
  handler: async (ctx, { userId, action }) => {
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      return { allowed: false, reason: "No credits found" };
    }

    const cost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 1;
    
    if (credits.credits < cost) {
      return { 
        allowed: false, 
        reason: "Insufficient credits",
        required: cost,
        available: credits.credits
      };
    }

    return { 
      allowed: true, 
      cost,
      remaining: credits.credits - cost
    };
  },
});

// Use credits for an action
export const useCredits = mutation({
  args: { 
    userId: v.string(), 
    action: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, { userId, action, description = "" }) => {
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      throw new Error("No credits found for user");
    }

    const cost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS] || 1;
    
    if (credits.credits < cost) {
      throw new Error(`Insufficient credits. Required: ${cost}, Available: ${credits.credits}`);
    }

    // Update credits
    const newCredits = credits.credits - cost;
    const newUsedCredits = credits.usedCredits + cost;

    await ctx.db.patch(credits._id, {
      credits: newCredits,
      usedCredits: newUsedCredits,
      updatedAt: Date.now(),
    });

    // Log the usage
    await ctx.db.insert("creditUsage", {
      userId,
      email: credits.email,
      action,
      creditsUsed: cost,
      description: description || `${action} performed`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      creditsUsed: cost,
      remainingCredits: newCredits,
      totalUsed: newUsedCredits
    };
  },
});

// Reset monthly credits
export const resetMonthlyCredits = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      throw new Error("No credits found for user");
    }

    const planConfig = CREDIT_PLANS[credits.plan as keyof typeof CREDIT_PLANS] || CREDIT_PLANS.free;
    const now = Date.now();
    const newResetDate = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    await ctx.db.patch(credits._id, {
      credits: planConfig.credits,
      totalCredits: planConfig.credits,
      usedCredits: 0,
      resetDate: newResetDate,
      updatedAt: now,
    });

    return {
      success: true,
      newCredits: planConfig.credits,
      resetDate: newResetDate
    };
  },
});

// Get credit usage history
export const getCreditUsage = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("creditUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// Upgrade user plan
export const upgradePlan = mutation({
  args: { 
    userId: v.string(), 
    newPlan: v.string() 
  },
  handler: async (ctx, { userId, newPlan }) => {
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!credits) {
      throw new Error("No credits found for user");
    }

    const planConfig = CREDIT_PLANS[newPlan as keyof typeof CREDIT_PLANS];
    if (!planConfig) {
      throw new Error("Invalid plan");
    }

    // Update plan and add credits
    await ctx.db.patch(credits._id, {
      plan: newPlan,
      credits: credits.credits + planConfig.credits, // Add new plan credits
      totalCredits: planConfig.credits,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newPlan: planConfig.name,
      creditsAdded: planConfig.credits
    };
  },
});

// Export constants for use in other files
export { CREDIT_PLANS, CREDIT_COSTS };
