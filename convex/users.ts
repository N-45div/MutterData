// User management functions for MutterData
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user by ID
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("_id"), userId))
      .first();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), email))
      .first();
  },
});

// List all users (for email fallback)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .order("desc")
      .collect();
  },
});

// Create or update user
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, avatar }) => {
    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), email))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        name: name || existing.name,
        avatar: avatar || existing.avatar,
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      email,
      name,
      avatar,
      plan: "free",
      usage: {
        voice_queries: 0,
        ai_insights: 0,
        file_uploads: 0,
        last_reset: Date.now(),
      },
    });
  },
});
