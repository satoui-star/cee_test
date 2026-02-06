
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full shadow-sm
          ${isUser ? 'bg-indigo-600 text-white ml-3' : 'bg-white border text-indigo-600 mr-3'}`}>
          <i className={`fa-solid ${isUser ? 'fa-user' : 'fa-robot'}`}></i>
        </div>
        <div className={`relative px-6 py-5 rounded-2xl shadow-sm text-sm leading-relaxed
          ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
          <div className="prose prose-sm max-w-none prose-slate">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>

          {/* Sources UI */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sources & Références :</span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[11px] transition-all group"
                  >
                    <i className="fa-solid fa-link text-[10px] opacity-50 group-hover:opacity-100"></i>
                    <span className="font-medium truncate max-w-[180px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={`text-[10px] mt-3 opacity-40 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
