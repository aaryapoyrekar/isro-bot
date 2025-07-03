import React from 'react';
import { Lightbulb, Satellite, Cloud, Map } from 'lucide-react';

interface SampleQuestionsProps {
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onQuestionSelect, isLoading }) => {
  const sampleQuestions = [
    {
      icon: <Satellite className="w-4 h-4" />,
      question: "What is INSAT-3D?",
      category: "Satellites"
    },
    {
      icon: <Cloud className="w-4 h-4" />,
      question: "How does MOSDAC help with weather forecasting?",
      category: "Weather"
    },
    {
      icon: <Map className="w-4 h-4" />,
      question: "What oceanographic data does MOSDAC provide?",
      category: "Ocean Data"
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      question: "What are the recent developments at MOSDAC?",
      category: "Updates"
    }
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-purple-300" />
        <span className="text-sm font-medium text-purple-200">Try Sample Questions</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sampleQuestions.map((sample, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(sample.question)}
            disabled={isLoading}
            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-50 backdrop-blur-sm border border-white/10 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white group-hover:from-purple-400 group-hover:to-indigo-400 transition-colors">
              {sample.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-purple-300 font-medium mb-1">
                {sample.category}
              </div>
              <div className="text-sm text-white truncate">
                {sample.question}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SampleQuestions;