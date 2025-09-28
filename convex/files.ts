import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get a specific dataset by ID
export const getDataset = query({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get the latest dataset for a user
export const getLatestDataset = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const datasets = await ctx.db
      .query("datasets")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(1);
    
    return datasets[0] || null;
  },
});

// Get all datasets for a user
export const getUserDatasets = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("datasets")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

// Store a new dataset with enhanced metadata
export const storeDataset = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    data: v.array(v.any()),
    rowCount: v.number(),
    columnCount: v.number(),
    columns: v.array(v.string()),
    summary: v.optional(v.string()),
    metadata: v.optional(v.object({
      dataTypes: v.record(v.string(), v.string()),
      sampleValues: v.record(v.string(), v.array(v.any())),
      statistics: v.record(v.string(), v.any()),
      sheetNames: v.optional(v.array(v.string())),
      insights: v.optional(v.array(v.string()))
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("datasets", {
      userId: args.userId,
      fileName: args.fileName,
      fileType: args.fileType,
      data: args.data,
      rowCount: args.rowCount,
      columnCount: args.columnCount,
      columns: args.columns,
      summary: args.summary,
      metadata: args.metadata,
      uploadedAt: Date.now(),
    });
  },
});

// Update dataset with analysis results
export const updateDatasetAnalysis = mutation({
  args: {
    id: v.id("datasets"),
    analysis: v.object({
      insights: v.array(v.string()),
      trends: v.optional(v.array(v.any())),
      summary: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      analysis: args.analysis,
      analyzedAt: Date.now(),
    });
  },
});

// Save dataset (alias for storeDataset with different parameter structure)
export const saveDataset = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    columns: v.array(v.object({
      name: v.string(),
      type: v.string(),
      sampleValues: v.array(v.any()),
    })),
    rows: v.array(v.any()),
    rowCount: v.number(),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("datasets", {
      userId: args.uploadedBy,
      fileName: args.fileName,
      fileType: args.fileType,
      data: args.rows,
      rowCount: args.rowCount,
      columnCount: args.columns.length,
      columns: args.columns.map(col => col.name),
      uploadedAt: args.uploadedAt,
    });
  },
});

// List all files (for Vapi integration) - now user-specific
export const listFiles = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.userId) {
      // Extract raw email from user_email format if needed
      const rawEmail = args.userId.startsWith('user_') 
        ? args.userId.substring(5) // Remove 'user_' prefix
        : args.userId;
      
      // Return datasets for specific user (check both formats)
      return await ctx.db
        .query("datasets")
        .filter((q) => 
          q.or(
            q.eq(q.field("userId"), args.userId),     // user_email@domain.com
            q.eq(q.field("userId"), rawEmail)         // email@domain.com
          )
        )
        .order("desc")
        .collect();
    } else {
      // Fallback: return all datasets (for backward compatibility)
      return await ctx.db
        .query("datasets")
        .order("desc")
        .collect();
    }
  },
});

// Delete a dataset
export const deleteDataset = mutation({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
