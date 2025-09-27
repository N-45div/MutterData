// Fast Data Pipeline for MutterData
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

interface FastAnalysis {
  fileName: string;
  rowCount: number;
  columnCount: number;
  insights: string[];
  stats: Record<string, any>;
  patterns: string[];
  anomalies: any[];
  textAnalysis?: {
    sentiment: string;
    topics: string[];
    keyPhrases: string[];
  };
  processedAt: number;
}

// Store analysis results
export const storeAnalysis = mutation({
  args: { analysis: v.any() },
  handler: async (ctx, { analysis }) => {
    return await ctx.db.insert("fastAnalysis", analysis);
  },
});

// Get cached analysis
export const getAnalysis = query({
  args: { fileName: v.string() },
  handler: async (ctx, { fileName }) => {
    return await ctx.db
      .query("fastAnalysis")
      .filter(q => q.eq(q.field("fileName"), fileName))
      .order("desc")
      .first();
  },
});

// Fast processing pipeline
export const fastProcess = action({
  args: {
    csvData: v.array(v.any()),
    fileName: v.string(),
  },
  handler: async (ctx, { csvData, fileName }) => {
    try {
      const columns = Object.keys(csvData[0] || {});
      const insights = generateFastInsights(csvData, columns);
      const stats = computeFastStats(csvData, columns);
      const patterns = detectPatterns(csvData, columns);
      const anomalies = detectAnomalies(csvData, columns);
      const textAnalysis = analyzeTextColumns(csvData, columns);
      
      const analysis: FastAnalysis = {
        fileName,
        rowCount: csvData.length,
        columnCount: columns.length,
        insights,
        stats,
        patterns,
        anomalies,
        textAnalysis,
        processedAt: Date.now(),
      };

      await ctx.runMutation(api.fastPipeline.storeAnalysis, { analysis });
      return { success: true, analysis };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});

function generateFastInsights(data: any[], columns: string[]): string[] {
  const insights: string[] = [];
  
  // Quick data quality check
  const completeness = columns.map(col => {
    const filled = data.filter(row => row[col] != null && row[col] !== '').length;
    return (filled / data.length) * 100;
  });
  
  const avgCompleteness = completeness.reduce((a, b) => a + b, 0) / completeness.length;
  insights.push(`📊 Data Quality: ${avgCompleteness.toFixed(1)}% complete`);
  
  // Identify column types
  const numCols = columns.filter(col => 
    data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])))
  );
  const textCols = columns.filter(col => 
    data.slice(0, 10).some(row => typeof row[col] === 'string' && row[col].length > 10)
  );
  
  insights.push(`🔢 ${numCols.length} numerical, ${textCols.length} text columns`);
  
  // Business insights
  if (data.length > 1000) {
    insights.push("📈 Large dataset - ML ready");
  }
  
  if (numCols.length > 3) {
    insights.push("🎯 High analytical potential");
  }
  
  return insights;
}

function computeFastStats(data: any[], columns: string[]): Record<string, any> {
  const stats: Record<string, any> = {};
  
  for (const col of columns.slice(0, 5)) { // Limit to 5 columns
    const values = data.map(row => row[col]).filter(v => v != null);
    
    if (values.every(v => !isNaN(parseFloat(v)))) {
      // Numerical column
      const nums = values.map(v => parseFloat(v));
      stats[col] = {
        type: 'numerical',
        mean: nums.reduce((a, b) => a + b, 0) / nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
      };
    } else {
      // Categorical/text column
      const unique = new Set(values).size;
      stats[col] = {
        type: 'categorical',
        unique: unique,
        diversity: unique / values.length,
      };
    }
  }
  
  return stats;
}

function detectPatterns(data: any[], columns: string[]): string[] {
  const patterns: string[] = [];
  
  // Time series pattern detection
  const dateColumns = columns.filter(col => 
    data.slice(0, 5).some(row => {
      const val = row[col];
      return val && (new Date(val).toString() !== 'Invalid Date');
    })
  );
  
  if (dateColumns.length > 0) {
    patterns.push("📅 Time series data detected - trending analysis available");
  }
  
  // Correlation patterns
  const numCols = columns.filter(col => 
    data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])))
  );
  
  if (numCols.length >= 2) {
    patterns.push("🔗 Multiple numerical columns - correlation analysis possible");
  }
  
  // Geographic patterns
  const geoColumns = columns.filter(col => 
    col.toLowerCase().includes('country') || 
    col.toLowerCase().includes('city') || 
    col.toLowerCase().includes('location')
  );
  
  if (geoColumns.length > 0) {
    patterns.push("🌍 Geographic data found - map visualization ready");
  }
  
  // Category patterns
  const categoryColumns = columns.filter(col => {
    const unique = new Set(data.slice(0, 100).map(row => row[col])).size;
    return unique < 20 && unique > 1;
  });
  
  if (categoryColumns.length > 0) {
    patterns.push(`📊 ${categoryColumns.length} categorical columns - segmentation ready`);
  }
  
  return patterns;
}

function detectAnomalies(data: any[], columns: string[]): any[] {
  const anomalies: any[] = [];
  
  // Detect numerical outliers using IQR method
  const numCols = columns.filter(col => 
    data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])))
  );
  
  for (const col of numCols.slice(0, 3)) { // Limit to 3 columns for performance
    const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
    if (values.length < 4) continue;
    
    values.sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = data.filter(row => {
      const val = parseFloat(row[col]);
      return val < lowerBound || val > upperBound;
    });
    
    if (outliers.length > 0) {
      anomalies.push({
        column: col,
        type: 'numerical_outlier',
        count: outliers.length,
        percentage: (outliers.length / data.length * 100).toFixed(1)
      });
    }
  }
  
  // Detect missing data patterns
  for (const col of columns.slice(0, 5)) {
    const missing = data.filter(row => !row[col] || row[col] === '').length;
    if (missing > data.length * 0.1) { // More than 10% missing
      anomalies.push({
        column: col,
        type: 'missing_data',
        count: missing,
        percentage: (missing / data.length * 100).toFixed(1)
      });
    }
  }
  
  return anomalies;
}

function analyzeTextColumns(data: any[], columns: string[]): FastAnalysis['textAnalysis'] {
  const textCols = columns.filter(col => 
    data.slice(0, 10).some(row => 
      typeof row[col] === 'string' && row[col].length > 10
    )
  );
  
  if (textCols.length === 0) return undefined;
  
  // Simple sentiment analysis
  const allText = data.slice(0, 100) // Limit for performance
    .map(row => textCols.map(col => row[col]).join(' '))
    .join(' ')
    .toLowerCase();
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive', 'success'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'fail', 'problem', 'issue'];
  
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (allText.split(word).length - 1), 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (allText.split(word).length - 1), 0);
  
  let sentiment = 'neutral';
  if (positiveCount > negativeCount * 1.5) sentiment = 'positive';
  else if (negativeCount > positiveCount * 1.5) sentiment = 'negative';
  
  // Extract common topics/phrases
  const words = allText.split(/\s+/).filter(word => word.length > 3);
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topics = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    sentiment,
    topics,
    keyPhrases: topics.slice(0, 3)
  };
}
