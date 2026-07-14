import React, { useState } from 'react';
import { RichDocument } from './BillingTypes';
import { 
  History, Search, Calendar, FileText, User, 
  ArrowRight, CheckCircle2, ShieldCheck, Tag
} from 'lucide-react';

interface BillingHistoryProps {
  documents: RichDocument[];
}

export function BillingHistory({ documents }: BillingHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all logs from documents
  const allLogs = documents.flatMap(doc => {
    const docLogs = doc.historyLogs || [];
    return docLogs.map(log => ({
      ...log,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      docType: doc.docType
    }));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredLogs = allLogs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return log.documentNumber.toLowerCase().includes(q) ||
           log.action.toLowerCase().includes(q) ||
           log.author.toLowerCase().includes(q);
  });

  const getDocTypeBadgeColor = (type: string) => {
    if (type.startsWith('client_')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const getDocTypeLabel = (type: string) => {
    switch(type) {
      case 'client_devis': return 'Devis client';
      case 'client_facture': return 'Facture client';
      case 'client_bl': return 'Bon livraison';
      case 'supplier_devis_req': return 'Demande devis';
      case 'supplier_br': return 'Bon réception';
      case 'supplier_facture': return 'Facture fourn.';
      default: return type;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Historique d'audit des pièces comptables
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Suivi en temps réel des créations, modifications et règlements des documents</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par n° de pièce ou action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold">Aucune activité enregistrée pour le moment</p>
          <p className="text-xs text-slate-400 mt-1">Créez ou modifiez un document commercial pour initier l'historique d'audit</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-3.5 space-y-6 pt-2">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="relative pl-7 group">
              
              {/* Point on timeline */}
              <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 border border-white group-hover:bg-indigo-500 transition-colors" />

              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {log.date}
                  </span>
                  
                  {/* Doc type badge */}
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getDocTypeBadgeColor(log.docType)}`}>
                    {getDocTypeLabel(log.docType)}
                  </span>

                  {/* Doc number */}
                  <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                    {log.documentNumber}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {log.action}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                  <User className="w-3.5 h-3.5" />
                  Auteur : <span className="text-slate-500">{log.author}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
