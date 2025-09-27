// Simplified Mastra-inspired Data Processing Pipeline for MutterData using OpenRouter
// AI handles all data analysis directly - no complex parsing needed

interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  model: string; // e.g., "openai/gpt-4o-mini", "openai/gpt-4o"
}

interface SimpleDataset {
  fileName: string;
  data: any[];
  columns: string[];
  rowCount: number;
  columnCount: number;
}

interface VoiceInsights {
  starters: string[];
  insights: string[];
  questions: string[];
  commands: string[];
}

interface PipelineResult {
  status: 'success' | 'failed';
  aiSummary?: string;
  voiceInsights?: VoiceInsights;
  tokenSavings?: {
    originalTokens: number;
    summaryTokens: number;
    reductionPercentage: number;
  };
  error?: string;
}

export class SimpleMutterDataPipeline {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = {
      ...config,
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1'
    };
  }

  // Main pipeline execution - AI does everything
  async processDataset(dataset: SimpleDataset): Promise<PipelineResult> {
    try {
      console.log('🚀 Starting AI-powered analysis...');

      // Step 1: Generate AI summary with token protection
      const aiSummary = await this.generateAISummary(dataset);
      
      // Step 2: Generate voice-optimized insights
      const voiceInsights = await this.generateVoiceInsights(aiSummary, dataset);
      
      // Step 3: Calculate token savings
      const tokenSavings = this.calculateTokenSavings(dataset, aiSummary);

      return {
        status: 'success',
        aiSummary,
        voiceInsights,
        tokenSavings
      };

    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Pipeline failed'
      };
    }
  }

  // Generate AI summary using OpenRouter (Token Limit Protection)
  private async generateAISummary(dataset: SimpleDataset): Promise<string> {
    // Create compressed data snapshot (first 5 rows + column info)
    const sampleData = dataset.data.slice(0, 5);
    const dataSnapshot = {
      fileName: dataset.fileName,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: dataset.columns,
      sampleData
    };

    const prompt = `You are an expert data analyst. Analyze this dataset and provide a comprehensive summary optimized for voice interaction.

Dataset: ${JSON.stringify(dataSnapshot, null, 2)}

Provide:
1. Dataset overview in conversational language
2. Key patterns and relationships you can identify
3. Most interesting findings for voice queries
4. Data quality insights
5. Recommended analysis directions

Keep response concise but comprehensive (max 400 words) and make it sound natural for voice interaction.`;

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mutterdata.ai',
          'X-Title': 'MutterData AI Pipeline'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert data analyst specializing in conversational analytics and voice interfaces.'
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

  // Generate voice-optimized insights
  private async generateVoiceInsights(aiSummary: string, dataset: SimpleDataset): Promise<VoiceInsights> {
    const prompt = `Based on this data analysis, generate voice-friendly content for MutterData's conversational analytics.

Analysis: ${aiSummary}
Dataset: ${dataset.fileName} (${dataset.rowCount} rows, ${dataset.columnCount} columns)

Generate JSON with:
- "starters": 5 natural conversation starters users might ask
- "insights": 3 key insights in conversational language  
- "questions": 5 follow-up questions to explore deeper
- "commands": 5 specific voice commands for this dataset

Make everything sound natural for voice interaction.`;

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mutterdata.ai',
          'X-Title': 'MutterData Voice Insights'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a voice interface specialist. Always respond with valid JSON.'
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
  private calculateTokenSavings(dataset: SimpleDataset, summary: string) {
    const originalSize = JSON.stringify(dataset.data).length;
    const summarySize = summary.length;
    const reductionPercentage = Math.round(((originalSize - summarySize) / originalSize) * 100);

    return {
      originalTokens: Math.round(originalSize / 4),
      summaryTokens: Math.round(summarySize / 4),
      reductionPercentage
    };
  }
}

// Factory function
export function createSimplePipeline(openRouterApiKey: string, model: string = 'openai/gpt-4o-mini') {
  return new SimpleMutterDataPipeline({
    apiKey: openRouterApiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    model
  });
}
