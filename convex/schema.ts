import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Datasets table for uploaded files with enhanced metadata
  datasets: defineTable({
    userId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    data: v.array(v.any()),
    rowCount: v.number(),
    columnCount: v.number(),
    columns: v.array(v.string()),
    summary: v.optional(v.string()),
    uploadedAt: v.number(),
    analysis: v.optional(v.object({
      insights: v.array(v.string()),
      trends: v.optional(v.array(v.any())),
      summary: v.string(),
    })),
    analyzedAt: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    lastAnalyzedAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      dataTypes: v.record(v.string(), v.string()),
      sampleValues: v.record(v.string(), v.array(v.any())),
      statistics: v.record(v.string(), v.any()),
      sheetNames: v.optional(v.array(v.string())),
      insights: v.optional(v.array(v.string()))
    })),
  })
    .index("by_user", ["userId"])
    .index("by_upload_time", ["uploadedAt"]),
    
  // Voice interactions log
  voice_interactions: defineTable({
    userId: v.string(),
    datasetId: v.optional(v.id("datasets")),
    query: v.string(),
    response: v.string(),
    timestamp: v.number(),
    duration: v.optional(v.number()),
    success: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_dataset", ["datasetId"])
    .index("by_timestamp", ["timestamp"]),

  // Users table for auth
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    plan: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    usage: v.optional(v.object({
      voice_queries: v.number(),
      ai_insights: v.number(),
      file_uploads: v.number(),
      last_reset: v.number(),
    })),
  })
    .index("by_email", ["email"]),

  // Credits System - Simple and Effective
  credits: defineTable({
    userId: v.string(),
    email: v.string(),
    plan: v.string(), // "free", "starter", "pro", "business"
    credits: v.number(), // Current credits balance
    totalCredits: v.number(), // Total credits for current billing cycle
    usedCredits: v.number(), // Credits used this cycle
    resetDate: v.number(), // When credits reset (monthly)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  // Credit Usage Logs - Track all usage
  creditUsage: defineTable({
    userId: v.string(),
    email: v.string(),
    action: v.string(), // "voice_query", "ai_insight", "file_upload", "email_report"
    creditsUsed: v.number(),
    description: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // User Sessions - For voice analytics authentication
  userSessions: defineTable({
    sessionId: v.string(),
    userId: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  // Fast analysis cache for performance
  fastAnalysis: defineTable({
    fileName: v.string(),
    rowCount: v.number(),
    columnCount: v.number(),
    insights: v.array(v.string()),
    stats: v.any(),
    patterns: v.array(v.string()),
    anomalies: v.array(v.any()),
    textAnalysis: v.optional(v.object({
      sentiment: v.string(),
      topics: v.array(v.string()),
      keyPhrases: v.array(v.string()),
    })),
    processedAt: v.number(),
  })
    .index("by_fileName", ["fileName"])
    .index("by_processedAt", ["processedAt"]),
});
