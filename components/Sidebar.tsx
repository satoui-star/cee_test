
import React from 'react';
import { CeeKnowledgeItem } from '../types';

interface SidebarProps {
  onScrape: () => void;
  isScanning: boolean;
  isIndexed: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  items: CeeKnowledgeItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onScrape, 
  isScanning, 
  isIndexed, 
  selectedDate, 
  setSelectedDate,
  items 
}) => {
  const fiches = items.filter(i => i.type === 'FICHE');
  const policy = items.filter(i => i.type !== 'FICHE');

  return (
    <div className="w-80 h-full bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 overflow-hidden shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <i className="fa-solid fa-leaf text-white text-xl"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">CEE AI Advisor</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collecte des données</h2>
          <button
            onClick={onScrape}
            disabled={isScanning}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 font-medium
              ${isScanning 
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-50 text-white shadow-lg shadow-indigo-900/20'}`}
          >
            <i className={`fa-solid ${isScanning ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
            <span>{isScanning ? 'Synchronisation...' : (isIndexed ? 'Rafraîchir les données' : 'Scanner le site web')}</span>
          </button>
          
          <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
            <label className="text-xs font-medium text-slate-400 block">Contexte temporel</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
            />
          </div>
        </section>

        {isIndexed && (
          <div className="space-y-6">
            {/* Policy Section */}
            {policy.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                   <i className="fa-solid fa-book-open mr-2"></i> Réglementation
                </h2>
                <div className="space-y-2">
                  {policy.map(item => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[11px]">
                      <span className="font-semibold text-indigo-300 block mb-1">{item.title}</span>
                      <p className="text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Fiches Section */}
            {fiches.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                  <i className="fa-solid fa-file-pdf mr-2"></i> Fiches Techniques
                </h2>
                <div className="space-y-2">
                  {fiches.map(item => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-default">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-400">{item.code}</span>
                        <span className="text-[10px] text-slate-500">{item.versionDate}</span>
                      </div>
                      <h3 className="text-[11px] font-medium text-slate-200 line-clamp-1">{item.title}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!isIndexed && !isScanning && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
            <i className="fa-solid fa-earth-europe text-4xl text-slate-700"></i>
            <p className="text-sm text-slate-500 italic">Aucune donnée du site <br/> n'est indexée.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          <span>Knowledge Base: Gemini-3 Ready</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
