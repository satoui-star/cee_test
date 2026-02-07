import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { CeeKnowledgeItem, ChatMessage as ChatMessageType, ScraperState } from './types';
import { mockScrapeCEE, getEffectiveKnowledge } from './services/ceeService';
import { askCeeExpertStream } from './services/geminiService';

const App: React.FC = () => {
  const [scraper, setScraper] = useState<ScraperState>({
    isScanning: false,
    isIndexed: false,
    items: [],
  });
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour. Je suis votre expert en économies d\'énergie (CEE). Je suis prêt à répondre à vos questions réglementaires et techniques. \n\nComment puis-je vous aider aujourd\'hui ?',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScrape = async () => {
    setScraper((prev: ScraperState) => ({ ...prev, isScanning: true }));
    try {
      const results = await mockScrapeCEE();
      setScraper({
        isScanning: false,
        isIndexed: true,
        items: results,
      });
      
      setMessages((prev: ChatMessageType[]) => [...prev, {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `Indexation terminée. J'ai maintenant accès aux fiches techniques et à la réglementation en vigueur.`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Scraping error:", error);
      setScraper((prev: ScraperState) => ({ ...prev, isScanning: false }));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsgId = Date.now().toString();
    const userMessage: ChatMessageType = {
      id: userMsgId,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialBotMessage: ChatMessageType = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      sources: [],
    };

    setMessages((prev: ChatMessageType[]) => [...prev, userMessage, initialBotMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const effectiveContext = getEffectiveKnowledge(scraper.items, selectedDate);
      const { stream, getGroundingSources } = await askCeeExpertStream(input, effectiveContext, selectedDate);

      let fullText = '';
      let lastChunk: any = null;

      for await (const chunk of stream) {
        lastChunk = chunk;
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
            m.id === assistantMsgId ? { ...m, content: fullText } : m
          ));
        }
      }

      if (lastChunk) {
        const sources = getGroundingSources(lastChunk);
        setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
          m.id === assistantMsgId ? { ...m, sources } : m
        ));
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.message?.includes("Clé API") 
        ? "Erreur : La clé API n'est pas configurée. Veuillez ajouter API_KEY dans les variables d'environnement de votre projet Vercel."
        : "Une erreur est survenue lors de la communication avec l'expert IA. Veuillez réessayer.";
      
      setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
        m.id === assistantMsgId ? { ...m, content: errorMsg } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        onScrape={handleScrape}
        isScanning={scraper.isScanning}
        isIndexed={scraper.isIndexed}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        items={getEffectiveKnowledge(scraper.items, selectedDate)}
      />

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></div>
            <h2 className="font-bold text-slate-800 tracking-tight">Expert CEE <span className="text-indigo-600 ml-1 text-xs px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">Intelligent</span></h2>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-400">
            <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <i className="fa-solid fa-clock-rotate-left mr-2 text-indigo-500"></i>
              <span>Date : {new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <i className="fa-solid fa-bolt mr-2"></i>
              Moteur Gemini-3
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg: ChatMessageType) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder="Posez votre question sur les CEE ou une fiche (ex: BAR-TH-164)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-800 placeholder:text-slate-400 shadow-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 bg-indigo-600 text-white p-2.5 px-5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center min-w-[60px]"
              >
                {isTyping ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="flex items-center"><i className="fa-solid fa-shield-halved text-indigo-500 mr-2"></i> Données Officielles</span>
              <span className="flex items-center"><i className="fa-solid fa-magnifying-glass text-indigo-500 mr-2"></i> Recherche Grounding</span>
              <span className="flex items-center"><i className="fa-solid fa-link text-indigo-500 mr-2"></i> Références PDF</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;