"use client";

import { useState, useEffect } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import ChartVisualization, { ChartConfig } from "./ChartVisualization";

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  confidence: number;
}

interface AnalysisResult {
  insights: string[];
  patterns: string[];
  anomalies: any[];
  charts?: ChartConfig[];
  textAnalysis?: {
    sentiment: string;
    topics: string[];
  };
}

interface VoiceAnalyticsInterfaceProps {
  dataset: any;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function VoiceAnalyticsInterface({ 
  dataset, 
  onAnalysisComplete 
}: VoiceAnalyticsInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    currentTranscript: "",
    confidence: 0
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [voicePrompts, setVoicePrompts] = useState<string[]>([
    "Try saying: 'Show me the top performers'",
    "Ask: 'What patterns do you see?'",
    "Say: 'Find any anomalies in the data'"
  ]);

  // Voice control functions - Connect to Vapi
  const startListening = async () => {
    setVoiceState(prev => ({ ...prev, isListening: true, currentTranscript: "" }));
    
    // Initialize Vapi client
    try {
      // Import Vapi dynamically
      const { default: Vapi } = await import('@vapi-ai/web');
      
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
      
      // Start Vapi call
      vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
      
      // Listen for Vapi events
      vapi.on('call-start', () => {
        setVoiceState(prev => ({ ...prev, isListening: true }));
      });
      
      vapi.on('call-end', () => {
        setVoiceState(prev => ({ ...prev, isListening: false, isSpeaking: false }));
      });
      
      vapi.on('speech-start', () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      });
      
      vapi.on('speech-end', () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      });
      
      vapi.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setVoiceState(prev => ({ 
            ...prev, 
            currentTranscript: message.transcript 
          }));
        }
      });
      
    } catch (error) {
      console.error('Failed to start Vapi:', error);
      // Fallback to Web Speech API
      fallbackToWebSpeech();
    }
  };

  const fallbackToWebSpeech = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        setVoiceState(prev => ({
          ...prev,
          currentTranscript: transcript,
          confidence: confidence
        }));
      };
      
      recognition.onend = () => {
        if (voiceState.currentTranscript) {
          processVoiceQuery(voiceState.currentTranscript);
        }
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };
      
      recognition.start();
    }
  };

  const stopListening = () => {
    setVoiceState(prev => ({ ...prev, isListening: false }));
  };

  const processVoiceQuery = async (query: string) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Call our enhanced fast pipeline
      const response = await fetch('/api/fast-analysis/' + encodeURIComponent(dataset.fileName));
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const analysis: AnalysisResult = {
            insights: result.analysis.insights || [],
            patterns: result.analysis.patterns || [],
            anomalies: result.analysis.anomalies || [],
            textAnalysis: result.analysis.textAnalysis
          };
          
          setCurrentAnalysis(analysis);
          onAnalysisComplete?.(analysis);
          
          // Speak the results
          speakResults(analysis, query);
        }
      }
    } catch (error) {
      console.error('Voice query processing failed:', error);
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const speakResults = (analysis: AnalysisResult, query: string) => {
    setVoiceState(prev => ({ ...prev, isSpeaking: true }));
    
    let responseText = `Based on your query "${query}", here's what I found: `;
    
    if (analysis.insights.length > 0) {
      responseText += analysis.insights.slice(0, 2).join('. ') + '. ';
    }
    
    if (analysis.patterns.length > 0) {
      responseText += `I detected ${analysis.patterns.length} key patterns. `;
    }
    
    if (analysis.anomalies.length > 0) {
      responseText += `There are ${analysis.anomalies.length} anomalies that need attention.`;
    }
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      {/* Voice Control Center */}
      <div className="max-w-4xl mx-auto">
        
        {/* Main Voice Interface */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 border border-orange-100">
          <div className="text-center">
            
            {/* Voice State Indicator */}
            <div className="relative mb-8">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                voiceState.isListening 
                  ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-lg shadow-red-200' 
                  : voiceState.isProcessing
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 animate-spin shadow-lg shadow-blue-200'
                  : voiceState.isSpeaking
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500 animate-bounce shadow-lg shadow-green-200'
                  : 'bg-gradient-to-br from-orange-500 to-amber-500 hover:shadow-xl shadow-lg shadow-orange-200'
              }`}>
                {voiceState.isListening ? (
                  <Mic className="w-12 h-12 text-white" />
                ) : voiceState.isProcessing ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : voiceState.isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </div>
              
              {/* Voice confidence indicator */}
              {voiceState.isListening && voiceState.confidence > 0 && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-3 py-1 rounded-full shadow-lg border">
                    <span className="text-xs font-medium text-gray-600">
                      {Math.round(voiceState.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Text */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {voiceState.isListening 
                  ? "I'm listening..." 
                  : voiceState.isProcessing
                  ? "Analyzing your data..."
                  : voiceState.isSpeaking
                  ? "Speaking results..."
                  : "Ready to analyze your data"
                }
              </h2>
              
              {voiceState.currentTranscript && (
                <p className="text-lg text-gray-600 italic">
                  "{voiceState.currentTranscript}"
                </p>
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={voiceState.isListening ? stopListening : startListening}
                disabled={voiceState.isProcessing || voiceState.isSpeaking}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  voiceState.isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
              >
                {voiceState.isListening ? (
                  <>
                    <MicOff className="w-5 h-5 inline mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 inline mr-2" />
                    Start Voice Analysis
                  </>
                )}
              </button>
            </div>

            {/* Voice Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {voicePrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {currentAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Insights Panel */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-6 h-6 text-orange-500 mr-2" />
                AI Insights
              </h3>
              <div className="space-y-3">
                {currentAnalysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Patterns Panel */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                Detected Patterns
              </h3>
              <div className="space-y-3">
                {currentAnalysis.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomalies Panel */}
            {currentAnalysis.anomalies.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
                  Data Anomalies ({currentAnalysis.anomalies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAnalysis.anomalies.map((anomaly, index) => (
                    <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800">{anomaly.column}</h4>
                      <p className="text-sm text-amber-700">
                        {anomaly.type.replace('_', ' ')}: {anomaly.count} items ({anomaly.percentage}%)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
