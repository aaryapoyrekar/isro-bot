import React, { useState, useRef, useEffect } from 'react';
import { Send, Satellite, Menu, X } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import Sidebar from './components/Sidebar';
import SampleQuestions from './components/SampleQuestions';

interface Source {
  filename?: string;
  type?: 'PDF' | 'DOCX' | 'XLSX' | 'Web' | 'Knowledge Base';
  page?: number;
  section?: string;
}

interface GeoLocation {
  lat: number;
  lon: number;
  label?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  source?: Source;
  context?: string;
  geoLocations?: GeoLocation[];
  processingTime?: number;
}

interface FilterOptions {
  fileTypes: {
    PDF: boolean;
    DOCX: boolean;
    XLSX: boolean;
    Web: boolean;
  };
  keyword: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m MOSDAC AI Help Bot, your space technology assistant. I can help you with satellite data, remote sensing, weather forecasting, and oceanographic information. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      source: {
        filename: 'MOSDAC Knowledge Base',
        type: 'Knowledge Base'
      }
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    fileTypes: { PDF: true, DOCX: true, XLSX: true, Web: true },
    keyword: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      
      // Include filter information in the request
      const requestBody = {
        query: textToSend,
        filters: filters
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || 'I apologize, but I couldn\'t process your request at the moment.',
        sender: 'bot',
        timestamp: new Date(),
        source: data.source || {
          filename: 'MOSDAC Knowledge Base',
          type: 'Knowledge Base'
        },
        context: data.context,
        geoLocations: data.geoLocations,
        processingTime: processingTime
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat API Error:', error);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚠️ Error: Unable to connect to MOSDAC AI service. Please check your connection and try again.',
        sender: 'bot',
        timestamp: new Date(),
        source: {
          filename: 'System Error',
          type: 'Knowledge Base'
        }
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInputText(question);
    handleSend(question);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>

      {/* Layout Container */}
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onFiltersChange={handleFiltersChange}
          filters={filters}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col max-w-full lg:max-w-none">
          {/* Header */}
          <header className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md border-b border-purple-500/20 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-purple-300" />
              </button>
              
              <div className="relative">
                <Satellite className="w-8 h-8 text-purple-300 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  🛰️ MOSDAC AI Help Bot
                </h1>
                <p className="text-purple-200 text-sm">
                  Advanced space technology assistant with RAG & geospatial analysis
                </p>
              </div>

              {/* Filter Status */}
              {(filters.keyword || !Object.values(filters.fileTypes).every(Boolean)) && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-600/20 rounded-lg">
                  <span className="text-xs text-purple-200">Filters Active</span>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </header>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md border-t border-purple-500/20 p-4 sm:p-6">
            {/* Sample Questions */}
            {messages.length <= 1 && !isLoading && (
              <SampleQuestions 
                onQuestionSelect={handleSampleQuestion}
                isLoading={isLoading}
              />
            )}

            {/* Input Row */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="message-input" className="sr-only">
                  Type your message
                </label>
                <input
                  ref={inputRef}
                  id="message-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about satellites, weather data, oceanography..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  autoComplete="off"
                />
              </div>
              
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 text-white p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Help text */}
            <p className="text-purple-200 text-xs mt-3 text-center">
              Press Enter to send • Shift+Enter for new line • Use filters to refine search context
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='25' cy='25' r='0.5' fill='%23ffffff' opacity='0.8'/><circle cx='70' cy='15' r='0.3' fill='%23ffffff' opacity='0.6'/><circle cx='90' cy='40' r='0.4' fill='%23ffffff' opacity='0.7'/><circle cx='15' cy='70' r='0.2' fill='%23ffffff' opacity='0.5'/><circle cx='50' cy='80' r='0.3' fill='%23ffffff' opacity='0.6'/><circle cx='80' cy='80' r='0.2' fill='%23ffffff' opacity='0.4'/></svg>") repeat;
          background-size: 400px 400px;
          animation: move-stars 50s linear infinite;
        }

        .twinkling {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='30' cy='20' r='0.2' fill='%23ffffff' opacity='0.9'/><circle cx='60' cy='60' r='0.1' fill='%23ffffff' opacity='0.8'/><circle cx='20' cy='50' r='0.1' fill='%23ffffff' opacity='0.7'/></svg>") repeat;
          background-size: 200px 200px;
          animation: move-twinkling 30s linear infinite;
        }

        @keyframes move-stars {
          from { transform: translateY(0px); }
          to { transform: translateY(-400px); }
        }

        @keyframes move-twinkling {
          from { transform: translateY(0px); }
          to { transform: translateY(-200px); }
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-thumb-purple-500::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-purple-500::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}

export default App;