import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
        <Bot className="w-5 h-5 text-white" />
      </div>

      {/* Typing Content */}
      <div className="max-w-xs sm:max-w-md lg:max-w-2xl">
        {/* Bot Name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-purple-300 text-sm">MOSDAC AI Bot</span>
          <span className="text-xs text-purple-200">is thinking...</span>
        </div>

        {/* Typing Bubble */}
        <div className="bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl px-4 py-3 shadow-md">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <span className="text-sm text-purple-200 ml-2">Processing your query...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;