'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Globe, Trash, Loader, Info, ChevronUp, ChevronDown, Image, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AnalysisContext {
  analysis_id?: string;
  disaster_type?: string;
  impact_level?: string;
  key_findings?: string[];
  recommendations?: string[];
}

// API configuration - can be changed in one place
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_ENDPOINTS = {
  status: `${API_BASE_URL}/api/chatbot/status`,
  chat: `${API_BASE_URL}/api/chatbot/chat`,
  clear: `${API_BASE_URL}/api/chatbot/chat/clear`,
  latestAnalysis: `${API_BASE_URL}/api/chatbot/analysis/latest-analysis`,
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can help you with disaster assessment questions. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotAvailable, setIsChatbotAvailable] = useState(true);
  const [backendStatus, setBackendStatus] = useState<string>('checking...');
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if chatbot is available on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        console.log('Checking chatbot availability at:', API_ENDPOINTS.status);
        const response = await fetch(API_ENDPOINTS.status);

        console.log('Status response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Status data:', data);

          setIsChatbotAvailable(data.initialized);
          setBackendStatus(data.status || 'ready');

          if (!data.initialized) {
            setMessages([
              {
                role: 'assistant',
                content: 'The chatbot is initializing. Some features may be limited until initialization completes.'
              }
            ]);
          }
        } else {
          setIsChatbotAvailable(false);
          setBackendStatus('unavailable');
          setMessages([
            {
              role: 'assistant',
              content: 'The chatbot service is currently unavailable. Please try again later.'
            }
          ]);
        }
      } catch (e) {
        console.error('Error checking chatbot status:', e);
        setIsChatbotAvailable(false);
        setBackendStatus('error');
        setMessages([
          {
            role: 'assistant',
            content: 'Unable to connect to the chatbot service. Please ensure the backend server is running.'
          }
        ]);
      }
    };

    checkAvailability();

    // Poll for status every 30 seconds if not initialized
    const intervalId = setInterval(() => {
      if (!isChatbotAvailable) {
        checkAvailability();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Check for analysis context
  useEffect(() => {
    const checkAnalysisContext = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.latestAnalysis);
        if (response.ok) {
          const data = await response.json();
          console.log('Analysis context:', data);
          setAnalysisContext(data.data);
        }
      } catch (error) {
        console.log('No analysis context available');
      }
    };

    checkAnalysisContext();

    // Poll for new analysis context every 15 seconds
    const interval = setInterval(checkAnalysisContext, 15000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isChatbotAvailable) return;

    const messageText = input.trim();

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to chatbot:', messageText);

      // Include analysis context ID if available
      const payload = {
        message: messageText,
        use_web_search: useWebSearch,
        analysis_id: analysisContext?.analysis_id
      };

      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Chat response status:', response.status);
      const data = await response.json();
      console.log('Chat response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to get response');
      }

      if (!data.success) {
        throw new Error(data.error || 'Chatbot returned an unsuccessful response');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      console.log('Clearing chat history');
      await fetch(API_ENDPOINTS.clear, {
        method: 'POST',
      });
      setMessages([
        { role: 'assistant', content: 'Chat history cleared. How can I help you?' },
      ]);
    } catch (error) {
      console.error('Error clearing chat:', error);
      setError('Failed to clear chat history');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleContextPanel = () => {
    setShowContext(!showContext);
  };

  const expandChatbot = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <button
        onClick={handleToggleChatbot}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Toggle chatbot"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chatbot widget */}
      {isOpen && (
        <div
          className={`fixed right-4 bg-white rounded-lg shadow-xl flex flex-col border z-50 transition-all duration-300 ease-in-out ${isExpanded
              ? 'bottom-4 left-4 top-20'
              : 'bottom-20 w-80 md:w-96 h-96'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-blue-50">
            <div>
              <h3 className="font-medium">Disaster Assessment Assistant</h3>
              <p className="text-xs text-gray-500">
                Status: {backendStatus} {isChatbotAvailable ? '✅' : '❌'}
              </p>
            </div>
            <div className="flex gap-2">
              {analysisContext && (
                <button
                  onClick={toggleContextPanel}
                  className={`p-1 rounded ${showContext ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  title="Toggle analysis context"
                >
                  <Info size={18} />
                </button>
              )}
              <button
                onClick={() => setUseWebSearch(!useWebSearch)}
                className={`p-1 rounded ${useWebSearch ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title={useWebSearch ? "Web search enabled" : "Web search disabled"}
                disabled={!isChatbotAvailable}
              >
                <Globe size={18} />
              </button>
              <button
                onClick={handleClearChat}
                className="p-1 rounded hover:bg-gray-100"
                title="Clear chat"
                disabled={!isChatbotAvailable}
              >
                <Trash size={18} />
              </button>
              <button
                onClick={expandChatbot}
                className="p-1 rounded hover:bg-gray-100"
                title={isExpanded ? "Collapse chatbot" : "Expand chatbot"}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              <button
                onClick={handleToggleChatbot}
                className="p-1 rounded hover:bg-gray-100"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100">
                      <Loader size={16} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="p-2 text-sm text-red-600 bg-red-50 rounded-lg">
                      {error}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isChatbotAvailable ? "Type your message..." : "Chatbot unavailable"}
                    className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={1}
                    disabled={isLoading || !isChatbotAvailable}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim() || !isChatbotAvailable}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Context Panel (Conditionally Rendered) */}
            {showContext && analysisContext && (
              <div className="w-64 border-l overflow-y-auto bg-gray-50 p-3">
                <h4 className="font-medium mb-2 flex items-center">
                  <Image size={16} className="mr-1" />
                  Analysis Context
                </h4>

                {analysisContext.disaster_type && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Disaster Type:</p>
                    <p className="text-sm">{analysisContext.disaster_type.charAt(0).toUpperCase() + analysisContext.disaster_type.slice(1)}</p>
                  </div>
                )}

                {analysisContext.impact_level && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Impact Level:</p>
                    <div className={`text-sm inline-block px-2 py-1 rounded ${analysisContext.impact_level === 'High'
                        ? 'bg-red-100 text-red-800'
                        : analysisContext.impact_level === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                      {analysisContext.impact_level}
                    </div>
                  </div>
                )}

                {analysisContext.key_findings && analysisContext.key_findings.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Key Findings:</p>
                    <ul className="text-xs list-disc pl-4">
                      {analysisContext.key_findings.map((finding, index) => (
                        <li key={index} className="mb-1">{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisContext.recommendations && analysisContext.recommendations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Recommendations:</p>
                    <ul className="text-xs list-disc pl-4">
                      {analysisContext.recommendations.slice(0, 3).map((recommendation, index) => (
                        <li key={index} className="mb-1">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4 flex items-center">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Ask the chatbot about this analysis for more details
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
