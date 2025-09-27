import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user session for voice analytics
export const createUserSession = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, { email, name, sessionId }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      // Update user info if needed
      await ctx.db.patch(existingUser._id, {
        name: name || existingUser.name,
      });
    } else {
      // Create new user
      userId = await ctx.db.insert("users", {
        email,
        name,
        plan: "free",
        usage: {
          voice_queries: 0,
          ai_insights: 0,
          file_uploads: 0,
          last_reset: Date.now(),
        },
      });
    }

    // Store session mapping
    await ctx.db.insert("userSessions", {
      sessionId,
      userId: userId.toString(),
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    });

    // Initialize credits if needed
    const userIdString = `user_${email}`;
    const existingCredits = await ctx.db
      .query("credits")
      .withIndex("by_user", (q) => q.eq("userId", userIdString))
      .first();

    if (!existingCredits) {
      await ctx.db.insert("credits", {
        userId: userIdString,
        email,
        plan: "free",
        credits: 100,
        totalCredits: 100,
        usedCredits: 0,
        resetDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      userId: userIdString,
      sessionId,
    };
  },
});

// Get user ID from session
export const getUserFromSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("sessionId"), sessionId))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
    };
  },
});

// Get the most recent active user (for voice analytics fallback)
export const getRecentActiveUser = query({
  args: {},
  handler: async (ctx) => {
    const recentSession = await ctx.db
      .query("userSessions")
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .order("desc")
      .first();

    if (recentSession) {
      return {
        userId: `user_${recentSession.email}`,
        email: recentSession.email,
        sessionId: recentSession.sessionId,
      };
    }

    return null;
  },
});

// Clean up expired sessions
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const expiredSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return { cleaned: expiredSessions.length };
  },
});
