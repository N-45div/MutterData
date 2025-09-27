"use client";

import { useState, useRef } from "react";
import { 
  Mic, 
  Upload, 
  FileSpreadsheet, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Plus,
  Play,
  Pause,
  Send,
  Loader2,
  Zap,
  TrendingUp,
  Users,
  Clock,
  User,
  Crown
} from "lucide-react";
import Link from "next/link";
import VoiceAnalyticsInterface from "@/components/VoiceAnalyticsInterface";
import ChartVisualization, { ChartConfig, generateChartConfig } from "@/components/ChartVisualization";
import CreditsDisplay from "@/components/CreditsDisplay";
import { processFile, ProcessedData } from "@/utils/fileProcessor";
import { analyzeQuery, processVoiceQuery, generateDatasetInsights } from "@/services/aiAnalytics";
import { useSession, signOut } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
// Removed Autumn - using custom credits system

export default function Dashboard() {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const saveDataset = useMutation(api.files.saveDataset);
  const createUserSession = useMutation(api.auth.createUserSession);
  
  // Real-time dataset fetching
  const datasets = useQuery(api.files.listFiles);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Credits data - Use real user ID from session
  const userId = session?.user?.email ? `user_${session.user.email}` : null;
  const userCredits = useQuery(api.credits.getUserCredits, 
    userId ? { userId } : "skip"
  );
  const initializeCredits = useMutation(api.credits.initializeCredits);
  
  // Create user session for voice analytics
  useEffect(() => {
    const setupUserSession = async () => {
      if (session?.user?.email && !sessionId) {
        try {
          const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const response = await createUserSession({
            email: session.user.email,
            name: session.user.name || undefined,
            sessionId: newSessionId,
          });
          
          if (response.success) {
            setSessionId(newSessionId);
            
            // Store session ID in localStorage for voice analytics
            localStorage.setItem('mutterdata_session_id', newSessionId);
            localStorage.setItem('mutterdata_user_id', `user_${session.user.email}`);
            
            console.log(`🔐 Created session: ${newSessionId} for user: ${session.user.email}`);
          } else {
            console.log('Session creation failed');
          }
        } catch (error) {
          console.log('Session creation failed:', error);
        }
      }
    };
    
    setupUserSession();
  }, [session, sessionId, createUserSession]);

  // Initialize credits for new users
  useEffect(() => {
    const initUserCredits = async () => {
      if (userId && userCredits === null && session?.user?.email) {
        try {
          await initializeCredits({
            userId,
            email: session.user.email,
            plan: "free"
          });
        } catch (error) {
          console.log("Credits initialization failed:", error);
        }
      }
    };

    initUserCredits();
  }, [userId, userCredits, initializeCredits, session?.user?.email]);
  const [currentDataset, setCurrentDataset] = useState<ProcessedData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fastAnalysis, setFastAnalysis] = useState<{
    insights?: string[];
    patterns?: string[];
    anomalies?: any[];
    textAnalysis?: any;
  } | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast analysis is now handled directly by Vapi - no need for separate endpoint
  const fetchFastAnalysis = async (fileName: string) => {
    // Real-time analysis is now handled by the voice interface
    // No need for pre-cached analysis since Vapi gets real data directly
    console.log(`Analysis for ${fileName} will be provided through voice interface`);
    return null;
  };

  // Show auth modal if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to MutterData</h1>
          <p className="text-gray-600 mb-6">
            Sign in to start analyzing your data with voice commands and AI-powered insights.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Sign In to Continue
          </button>
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            defaultMode="signin"
          />
        </div>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const result = await processFile(file);
      if (result.success && result.data) {
        setCurrentDataset(result.data);
        
        // Save to Convex database
        try {
          const datasetId = await saveDataset({
            fileName: result.data.fileName,
            fileType: result.data.fileType,
            columns: result.data.columns,
            rows: result.data.rows,
            rowCount: result.data.rowCount,
            uploadedBy: session?.user?.email || 'anonymous',
            uploadedAt: Date.now()
          });
          
          console.log("Dataset saved to Convex with ID:", datasetId);
          
          // Trigger fast analysis
          await fetchFastAnalysis(result.data.fileName);
        } catch (convexError) {
          console.error("Failed to save to Convex:", convexError);
        }
      } else {
        console.error("File processing failed:", result.error);
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Removed sample data functionality - using real datasets only

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                MutterData
              </span>
            </div>
            {currentDataset && (
              <div className="text-gray-500">
                • {currentDataset.fileName}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Welcome, {session.user.name?.split(' ')[0] || 'User'}
            </div>
            <Link 
              href="/profile"
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Profile</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-100px)]">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upload Section */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Data</h3>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer ${
                  isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessingFile ? (
                  <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm text-gray-600">
                  {isProcessingFile ? 'Processing file...' : 'Drop Excel/CSV files here or click to browse'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessingFile}
              />
              
              {/* Real-time Dataset List */}
              {datasets && datasets.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Datasets</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {datasets.slice(0, 5).map((dataset) => (
                      <div
                        key={dataset._id}
                        onClick={() => setSelectedDatasetId(dataset._id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedDatasetId === dataset._id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {dataset.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {dataset.rowCount} rows • {dataset.columnCount} columns
                            </p>
                          </div>
                          <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(dataset.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dataset Info */}
            {currentDataset && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Dataset</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {currentDataset.fileName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Rows:</span> {currentDataset.rowCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Columns:</span> {currentDataset.columns.length}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Datasets */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Datasets</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">sales_q3_2024.xlsx</span>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">customer_data.csv</span>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">marketing_metrics.xlsx</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Voice-First Interface */}
          <div className="lg:col-span-6">
            {currentDataset ? (
              <VoiceAnalyticsInterface 
                dataset={currentDataset}
                onAnalysisComplete={(result) => {
                  // Handle analysis results
                  setFastAnalysis(result);
                }}
              />
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Your Data to Begin</h3>
                <p className="text-gray-600 text-center mb-6">
                  Drop an Excel or CSV file to start analyzing your data with voice commands.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Enhanced with Fast Analysis Results */}
          <div className="w-80 space-y-6">
            
            {/* Credits & Plan Info */}
            {userCredits && <CreditsDisplay credits={userCredits} />}
            {/* Fast Analysis Insights */}
            {fastAnalysis && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="w-5 h-5 text-orange-500 mr-2" />
                  AI Insights
                </h3>
                <div className="space-y-2">
                  {fastAnalysis.insights?.slice(0, 3).map((insight: string, index: number) => (
                    <div key={index} className="p-2 bg-orange-50 rounded text-sm text-orange-800">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Commands Help */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Mic className="w-5 h-5 mr-2" />
                Voice Commands
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-200 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-orange-100">"Show me patterns in the data"</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-200 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-orange-100">"Find any anomalies"</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-200 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-orange-100">"Email me this analysis"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
