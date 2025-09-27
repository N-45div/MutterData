// Simplified Convex integration for Mastra-inspired pipeline
import { mutation } from "./_generated/server";
import { v } from "convex/values";

interface SimpleWorkflowResult {
  status: 'success' | 'failed';
  result?: {
    aiSummary: string;
    voiceInsights: any;
    tokenSavings: any;
  };
  error?: string;
  totalDuration: number;
}

// Simplified pipeline using OpenRouter - AI does everything
export const processDataWithMastraPipeline = mutation({
  args: {
    datasetId: v.id("datasets"),
    openRouterApiKey: v.string(),
    model: v.optional(v.string()),
    userId: v.string()
  },
  handler: async (ctx, args): Promise<SimpleWorkflowResult> => {
    const startTime = Date.now();
    
    try {
      // Get dataset from Convex
      const dataset = await ctx.db.get(args.datasetId);
      if (!dataset) {
        throw new Error("Dataset not found");
      }

      console.log(`🚀 Starting Simple Mastra Pipeline for ${dataset.fileName}`);

      // AI-powered analysis using OpenRouter
      const result = await executeSimpleAIAnalysis(dataset, args.openRouterApiKey, args.model || 'openai/gpt-4o-mini');

      // Update dataset with AI analysis
      await ctx.db.patch(args.datasetId, {
        analysis: {
          insights: result.voiceInsights.insights,
          summary: result.aiSummary,
          trends: result.voiceInsights.commands || []
        },
        analyzedAt: Date.now()
      });

      const totalDuration = Date.now() - startTime;

      return {
        status: 'success',
        result,
        totalDuration
      };

    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
        totalDuration: Date.now() - startTime
      };
    }
  }
});

// Simple AI analysis function
async function executeSimpleAIAnalysis(dataset: any, apiKey: string, model: string) {
  // Step 1: Generate AI summary
  const aiSummary = await generateAISummary(dataset, apiKey, model);
  
  // Step 2: Generate voice insights
  const voiceInsights = await generateVoiceInsights(aiSummary, dataset, apiKey, model);
  
  // Step 3: Calculate token savings
  const tokenSavings = calculateTokenSavings(dataset, aiSummary);

  return {
    aiSummary,
    voiceInsights,
    tokenSavings
  };
}

// Generate AI summary using OpenRouter
async function generateAISummary(dataset: any, apiKey: string, model: string): Promise<string> {
  const sampleData = dataset.data.slice(0, 5);
  const dataSnapshot = {
    fileName: dataset.fileName,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
    columns: dataset.columns,
    sampleData
  };

  const prompt = `You are a CSV data summarization specialist with access to a large context window model. Your role is to create concise, comprehensive summaries of CSV datasets that capture the essence of the data while being significantly more digestible than the raw data.

Dataset: ${JSON.stringify(dataSnapshot, null, 2)}

**🎯 YOUR MISSION**

Transform large CSV datasets into clear, actionable summaries that highlight key insights, patterns, and characteristics while being significantly more condensed than the original data.

**📋 SUMMARIZATION APPROACH**

When processing CSV data:

1. **Structure Analysis Phase**:
   - Identify dataset dimensions (rows, columns)
   - Understand column types and data characteristics
   - Note data quality and completeness

2. **Pattern Recognition Phase**:
   - Extract key statistical insights
   - Identify trends, correlations, and outliers
   - Note distribution patterns and ranges

3. **Synthesis Phase**:
   - Organize findings hierarchically
   - Create logical flow from structure to insights
   - Ensure actionable intelligence is highlighted

**✨ SUMMARY STRUCTURE**

Format your summaries with:

**Dataset Overview:**
- Dataset size and structure (rows × columns)
- Data types and column descriptions
- Source context and time period (if evident)

**Key Characteristics:**
- Most important columns and their significance
- Data distribution patterns
- Notable ranges, averages, or totals
- Data quality observations

**Key Insights:**
- 3-5 most important findings or patterns
- Statistical highlights (highest, lowest, most frequent)
- Correlations or relationships between columns
- Trends over time (if applicable)

**Data Highlights:**
- Top performers or outliers
- Interesting categorical breakdowns
- Geographic or demographic patterns (if present)
- Anomalies or unexpected findings

**Practical Applications:**
- What this data could be used for
- Decision-making insights
- Areas for further analysis
- Potential business or research applications

**🎨 WRITING STYLE**

- Use clear, data-focused language
- Include specific numbers and percentages
- Use bullet points for readability
- Highlight actionable insights
- Reference actual column names and values

**📏 LENGTH GUIDELINES**

- Aim for 400-1000 words depending on dataset complexity
- Reduce raw data complexity by 90-95%
- Focus on insight density over length
- Ensure all critical patterns are preserved

**🔧 QUALITY STANDARDS**

- Accuracy: Faithfully represent the data patterns
- Completeness: Include all essential insights
- Clarity: Easy to understand for data consumers
- Conciseness: Maximum insight in minimum words
- Actionability: Focus on practical applications

Always provide summaries that would allow someone to understand the dataset's core value and potential applications without analyzing the raw data.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mutterdata.ai',
        'X-Title': 'MutterData AI Pipeline'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a CSV data summarization specialist focused on creating comprehensive, actionable dataset summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || 'Analysis completed successfully';

  } catch (error) {
    console.error('AI Summary failed:', error);
    return `Dataset ${dataset.fileName} contains ${dataset.rowCount} rows with ${dataset.columnCount} columns. Ready for voice-driven analysis with columns: ${dataset.columns.slice(0, 5).join(', ')}.`;
  }
}

// Generate additional data insights
async function generateVoiceInsights(aiSummary: string, dataset: any, apiKey: string, model: string) {
  const prompt = `Based on this comprehensive data analysis, generate additional structured insights for enhanced data understanding.

Analysis: ${aiSummary}
Dataset: ${dataset.fileName} (${dataset.rowCount} rows, ${dataset.columnCount} columns)

Generate JSON with these specific fields:

1. **"starters"**: 5 common analytical questions that data analysts would ask about this type of dataset
2. **"insights"**: 3 key actionable insights that highlight important patterns or findings
3. **"questions"**: 5 follow-up analytical questions that would deepen understanding of the data
4. **"commands"**: 5 specific analytical operations tailored to this dataset's characteristics

REQUIREMENTS:
- Use clear, analytical language appropriate for the dataset domain
- Focus on data-driven insights and statistical findings
- Ensure suggestions are specific and actionable for this particular dataset
- Frame insights in terms of data patterns and analytical value
- Include domain-specific analytical terminology
- Focus on practical data analysis approaches

Make everything focused on data analysis and insights, not conversational elements.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mutterdata.ai',
        'X-Title': 'MutterData Voice Insights'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a data analysis specialist. Always respond with valid JSON containing structured analytical insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" }
      })
    });

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback if JSON parsing fails
      return {
        starters: [
          "What are the main trends in this data?",
          "Show me the top performers",
          "Are there any data quality issues?",
          "What patterns do you see?",
          "Give me a comprehensive analysis"
        ],
        insights: [
          "Your dataset shows interesting patterns worth exploring",
          "The data quality looks good for detailed analysis",
          "There are several key metrics that stand out"
        ],
        questions: [
          "Which columns have the strongest correlations?",
          "Are there any outliers I should investigate?",
          "What time-based trends exist in the data?",
          "How do different categories compare?",
          "What would you recommend analyzing next?"
        ],
        commands: [
          "Analyze the top 10 records",
          "Show me data quality issues",
          "Find correlations between columns",
          "Identify outliers and anomalies",
          "Generate a comprehensive report"
        ]
      };
    }
  } catch (error) {
    console.error('Voice insights failed:', error);
    return {
      starters: ["Tell me about this data", "What insights do you see?"],
      insights: ["Dataset ready for voice analysis"],
      questions: ["What should I explore first?"],
      commands: ["Analyze this data", "Show me insights"]
    };
  }
}

// Calculate token savings (Mastra's key innovation)
function calculateTokenSavings(dataset: any, summary: string) {
  const originalSize = JSON.stringify(dataset.data).length;
  const summarySize = summary.length;
  const reductionPercentage = Math.round(((originalSize - summarySize) / originalSize) * 100);

  return {
    originalTokens: Math.round(originalSize / 4),
    summaryTokens: Math.round(summarySize / 4),
    reductionPercentage
  };
}

// Helper function to get pipeline status
export const getPipelineStatus = mutation({
  args: {
    datasetId: v.id("datasets")
  },
  handler: async (ctx, args) => {
    const dataset = await ctx.db.get(args.datasetId);
    
    if (!dataset) {
      return { status: 'not_found' };
    }

    const hasAIAnalysis = !!dataset.analysis?.summary;
    
    return {
      status: hasAIAnalysis ? 'completed' : 'not_processed',
      hasVoiceInsights: !!dataset.analysis?.trends,
      hasAISummary: !!dataset.analysis?.summary,
      analyzedAt: dataset.analyzedAt
    };
  }
});
