import React from 'react';
import { Bot, User, FileText, MapPin, Clock } from 'lucide-react';
import GeoMap from './GeoMap';

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

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const extractGeoLocations = (text: string): GeoLocation[] => {
    const geoRegex = /\{lat:\s*(-?\d+\.?\d*),\s*lon:\s*(-?\d+\.?\d*)\}/g;
    const locations: GeoLocation[] = [];
    let match;

    while ((match = geoRegex.exec(text)) !== null) {
      locations.push({
        lat: parseFloat(match[1]),
        lon: parseFloat(match[2])
      });
    }

    return locations;
  };

  const geoLocations = message.geoLocations || extractGeoLocations(message.text);
  const cleanText = message.text.replace(/\{lat:\s*-?\d+\.?\d*,\s*lon:\s*-?\d+\.?\d*\}/g, '').trim();

  return (
    <div
      className={`flex items-start gap-4 mb-6 ${
        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
          message.sender === 'user'
            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
            : 'bg-gradient-to-br from-purple-600 to-indigo-600'
        }`}
      >
        {message.sender === 'user' ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-2xl ${
          message.sender === 'user' ? 'ml-auto' : 'mr-auto'
        }`}
      >
        {/* Bot Name */}
        {message.sender === 'bot' && (
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-purple-300 text-sm">MOSDAC AI Bot</span>
            {message.processingTime && (
              <div className="flex items-center gap-1 text-xs text-purple-200">
                <Clock className="w-3 h-3" />
                <span>{message.processingTime}ms</span>
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-md ${
            message.sender === 'user'
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
              : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
          }`}
        >
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {cleanText}
          </p>

          {/* Timestamp */}
          <p
            className={`text-xs mt-2 ${
              message.sender === 'user'
                ? 'text-blue-100'
                : 'text-purple-200'
            }`}
          >
            {formatTime(message.timestamp)}
          </p>
        </div>

        {/* Source Information */}
        {message.source && message.sender === 'bot' && (
          <div className="mt-2 p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <FileText className="w-3 h-3" />
              <span className="font-medium">Source:</span>
              <span>{message.source.filename || 'Knowledge Base'}</span>
              {message.source.type && (
                <span className="px-2 py-1 bg-purple-500/20 rounded-md text-purple-200">
                  {message.source.type}
                </span>
              )}
              {message.source.page && (
                <span className="text-purple-300">Page {message.source.page}</span>
              )}
            </div>
          </div>
        )}

        {/* Context Preview */}
        {message.context && message.sender === 'bot' && (
          <div className="mt-2 p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-xs text-purple-200">
              <span className="font-medium">Context:</span>
              <p className="mt-1 text-purple-300 italic">
                "{message.context.substring(0, 100)}..."
              </p>
            </div>
          </div>
        )}

        {/* Geo Map */}
        {geoLocations.length > 0 && message.sender === 'bot' && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-purple-200">
              <MapPin className="w-3 h-3" />
              <span className="font-medium">Geographic Locations</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/20">
              <GeoMap locations={geoLocations} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;