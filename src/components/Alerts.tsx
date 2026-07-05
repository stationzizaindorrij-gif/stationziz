import React from 'react';
import { 
  AlertTriangle, Check, ShieldAlert, Sparkles, Terminal, 
  Trash2, Bell, RefreshCw, Layers, ShieldCheck, Clock 
} from 'lucide-react';
import { ERPStoreType } from '../store';

interface AlertsProps {
  store: ERPStoreType;
}

export default function Alerts({ store }: AlertsProps) {
  const { alerts, auditLogs, markAlertAsRead, clearAllAlerts, currentRole } = store;

  // Active alerts
  const unreadAlerts = alerts.filter(a => !a.isRead);
  const readAlerts = alerts.filter(a => a.isRead);

  // Trigger signal check simulation
  const handleSimulateIoTCheck = () => {
    alert("[SIMULATION IoT] Communication vérifiée sur l'intégralité des 4 cuves de stockage et 8 pistolets actifs.\nTaux de perte de paquets : 0.0%\nSignal RF : Excellent (98%)");
  };

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager';

  return (
    <div className="space-y-6" id="alerts-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Centre de Supervision IoT & Alertes</h1>
          <p className="text-sm text-slate-500">Consultez les télémétries automatiques des cuves de stockage, pistolets et états de caisse.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSimulateIoTCheck}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            Tester le signal IoT des Bornes
          </button>
          {hasWriteAccess && (
            <button 
              onClick={clearAllAlerts}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer l'historique d'alertes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche & Centre : Alertes System */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-rose-500" />
            Notifications système en attente ({unreadAlerts.length})
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {unreadAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3.5 border rounded-xl flex items-start gap-3 justify-between ${
                  alert.severity === 'danger' 
                    ? 'bg-[#fff1f2b3] border-rose-200 text-rose-950' 
                    : 'bg-[#fffbebb3] border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'danger' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-xs font-semibold leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block font-mono mt-1">
                      {new Date(alert.date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => markAlertAsRead(alert.id)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded font-bold text-[10px] shrink-0 transition-colors"
                >
                  Acquitter
                </button>
              </div>
            ))}

            {unreadAlerts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-[#f8fafc80]">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Aucune alerte en attente</p>
                <p className="mt-0.5">Tous les sous-systèmes matériels et financiers sont à l'équilibre.</p>
              </div>
            )}
          </div>

          {/* Alertes archivées (Déjà lues) */}
          {readAlerts.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Alertes lues & acquittées ({readAlerts.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {readAlerts.map(alert => (
                  <div key={alert.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="truncate pr-3 max-w-md font-sans">{alert.message}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">Lue</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite : Logs d'Audit (Sécurité & Modifications) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-indigo-500" />
            Registre d'audit (Logs)
          </h3>
          <p className="text-[11px] text-slate-400">Suivi en temps réel de toutes les écritures et modifications de configurations de la station.</p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono space-y-1">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="font-sans font-semibold text-slate-500 uppercase text-[9px] bg-slate-200 px-1 py-0.5 rounded">
                    {log.module}
                  </span>
                  <span>{log.time}</span>
                </div>
                <p className="text-slate-700 font-sans leading-relaxed font-medium">{log.details}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans pt-1">
                  <span>Opérateur: <strong>{log.user}</strong></span>
                  <span>{new Date(log.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
