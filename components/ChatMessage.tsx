import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Fonction de rendu personnalisée pour simuler un parseur Markdown léger
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      let currentLine = line.trim();

      // 1. Gestion des Titres (###)
      if (currentLine.startsWith('###')) {
        const titleText = currentLine.replace(/^###\s*/, '');
        elements.push(
          <h3 key={`h3-${index}`} className="text-base font-bold mt-5 mb-2 brand-text-indigo flex items-center">
            <span className="w-1.5 h-1.5 rounded-full brand-bg-jaune mr-2"></span>
            {titleText}
          </h3>
        );
        return;
      }

      // 2. Gestion des Formules Mathématiques ($$ ... $$)
      if (currentLine.startsWith('$$') && currentLine.endsWith('$$')) {
        const formula = currentLine.substring(2, currentLine.length - 2);
        elements.push(
          <div key={`math-${index}`} className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-[#4754FF] shadow-inner overflow-x-auto">
            {formula}
          </div>
        );
        return;
      }

      // 3. Gestion des Listes (* ou -)
      if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
        const listText = currentLine.substring(2);
        elements.push(
          <div key={`li-${index}`} className="flex items-start space-x-2 mb-1.5 ml-2">
            <span className="text-[#4754FF] mt-1.5 text-[8px] flex-shrink-0">
              <i className="fa-solid fa-circle"></i>
            </span>
            <span>{processInlineFormatting(listText)}</span>
          </div>
        );
        return;
      }

      // 4. Paragraphe standard
      if (currentLine === '') {
        elements.push(<div key={`br-${index}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="mb-2 leading-relaxed">
            {processInlineFormatting(currentLine)}
          </p>
        );
      }
    });

    return elements;
  };

  // Gère le gras (**text**) et l'italique (_text_) à l'intérieur d'une ligne
  const processInlineFormatting = (text: string) => {
    // Regex pour le gras
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-[#161637]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl shadow-sm
          ${isUser ? 'bg-[#4754FF] text-white ml-3' : 'bg-[#161637] text-white mr-3'}`}>
          <i className={`fa-solid ${isUser ? 'fa-user' : 'fa-shield-heart'}`}></i>
        </div>
        <div className={`relative px-6 py-5 rounded-2xl shadow-sm text-[14px]
          ${isUser 
            ? 'bg-[#4754FF] text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
          
          <div className="max-w-none">
            {renderFormattedContent(message.content)}
          </div>

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Références Techniques :</span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-[#4754FF] hover:bg-[#4754FF]/5 text-[#4754FF] px-3 py-1.5 rounded-lg text-[11px] transition-all group font-medium"
                  >
                    <i className="fa-solid fa-link text-[10px] opacity-40 group-hover:opacity-100"></i>
                    <span className="truncate max-w-[200px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={`text-[10px] mt-4 font-bold opacity-30 uppercase tracking-tighter ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;