"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import Vapi from "@vapi-ai/web";

// Vapi Web SDK types
interface VapiMessage {
  type: 'transcript' | 'function-call' | 'status-update';
  role?: 'user' | 'assistant';
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: any;
  };
  call?: {
    id: string;
    status: string;
  };
}

// Using the imported Vapi class directly

interface VoiceInterfaceProps {
  onTranscript?: (transcript: string, role: 'user' | 'assistant') => void;
  onFunctionCall?: (functionCall: { name: string; parameters: any }) => any;
  assistantId?: string;
  className?: string;
}

export default function VoiceInterface({ 
  onTranscript, 
  onFunctionCall, 
  assistantId,
  className = "" 
}: VoiceInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const vapiRef = useRef<Vapi | null>(null);

  // Initialize Vapi SDK
  useEffect(() => {
    const initializeVapi = () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
        
        if (!apiKey) {
          setError('Vapi API key not configured');
          setIsLoading(false);
          return;
        }
        
        console.log('Initializing Vapi with API key:', apiKey.substring(0, 8) + '...');
        vapiRef.current = new Vapi(apiKey);
        
        setupEventListeners();
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing Vapi:', err);
        setError(`Failed to initialize Vapi: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initializeVapi();
  }, []);

  const setupEventListeners = () => {
    if (!vapiRef.current) return;

    const vapi = vapiRef.current;

    // Call start event
    vapi.on('call-start', () => {
      setIsConnected(true);
      setIsListening(true);
      setError(null);
    });

    // Call end event
    vapi.on('call-end', () => {
      setIsConnected(false);
      setIsListening(false);
    });

    // Message events
    vapi.on('message', (message: VapiMessage) => {
      if (message.type === 'transcript' && message.transcript && message.role) {
        onTranscript?.(message.transcript, message.role);
      }
      
      if (message.type === 'function-call' && message.functionCall) {
        const result = onFunctionCall?.(message.functionCall);
        // In a real implementation, you'd send the result back to Vapi
        console.log('Function call result:', result);
      }
    });

    // Error handling
    vapi.on('error', (error: any) => {
      console.error('Vapi error:', error);
      setError('Voice connection error');
      setIsConnected(false);
      setIsListening(false);
    });
  };

  const startVoiceCall = async () => {
    if (!vapiRef.current) {
      setError('Vapi not initialized');
      return;
    }

    try {
      setError(null);
      // Use provided assistant ID or a default one
      const defaultAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'demo-assistant';
      await vapiRef.current.start(assistantId || defaultAssistantId);
    } catch (err) {
      console.error('Error starting voice call:', err);
      setError('Failed to start voice call');
    }
  };

  const stopVoiceCall = async () => {
    if (!vapiRef.current) return;

    try {
      await vapiRef.current.stop();
    } catch (err) {
      console.error('Error stopping voice call:', err);
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    
    const newMutedState = !isMuted;
    vapiRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  const handleVoiceToggle = () => {
    if (isConnected) {
      stopVoiceCall();
    } else {
      startVoiceCall();
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    
    // Reinitialize Vapi
    try {
      const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
      
      if (!apiKey) {
        setError('Vapi API key not configured');
        setIsLoading(false);
        return;
      }
      
      vapiRef.current = new Vapi(apiKey);
      setupEventListeners();
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error reinitializing Vapi:', err);
      setError('Failed to reinitialize Vapi');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${className}`}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <MicOff className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={handleRetry}
          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Main Voice Button */}
      <button
        onClick={handleVoiceToggle}
        disabled={isLoading}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-3 ${
          isConnected
            ? isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-yellow-500 hover:bg-yellow-600"
            : "bg-blue-600 hover:bg-blue-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {/* Status Text */}
      <p className="text-sm text-gray-600 mb-2">
        {isConnected
          ? isListening
            ? "Listening..."
            : "Connected"
          : "Click to start voice chat"}
      </p>

      {/* Mute Button (only show when connected) */}
      {isConnected && (
        <button
          onClick={toggleMute}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Connection Status Indicator */}
      <div className="flex items-center justify-center space-x-1 mt-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
}
