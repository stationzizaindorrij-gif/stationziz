import React, { useState, useMemo } from 'react';
import { 
  Droplets, Sparkles, Calendar, User, Plus, Search, Filter, 
  Trash2, Printer, Download, TrendingUp, CheckCircle2, DollarSign, 
  Clock, ArrowUpRight, FileText, BarChart3, Layers, ChevronRight, X
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Shift } from '../types';

interface LavageGraissageProps {
  store: ERPStoreType;
}

interface ServiceRecord {
  id: string;
  serviceName: string;
  amount: number;
  shiftId: string;
  shiftDate: string;
  shiftName: string;
  attendantId: string;
  attendantName: string;
  shiftStatus: string;
}

export default function LavageGraissage({ store }: LavageGraissageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedAttendant, setSelectedAttendant] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  // Form State for Quick Add
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceAmount, setNewServiceAmount] = useState('');

  // Extract all Lavage & Graissage records from store.shifts
  const allRecords = useMemo(() => {
    const records: ServiceRecord[] = [];
    store.shifts.forEach((shift) => {
      const services = shift.servicesSold || [];
      services.forEach((srv: any, idx: number) => {
        records.push({
          id: srv.id || `srv_${shift.id}_${idx}`,
          serviceName: srv.name || 'Lavage / Graissage',
          amount: Number(srv.total) || Number(srv.amount) || 0,
          shiftId: shift.id,
          shiftDate: shift.date || 'Non spécifié',
          shiftName: shift.shiftName || 'Journée',
          attendantId: shift.attendantId || '',
          attendantName: shift.attendantName || 'Pompiste Inconnu',
          shiftStatus: shift.status || 'completed',
        });
      });
    });

    // Sort newest date first
    return records.sort((a, b) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime());
  }, [store.shifts]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // Search term
      const matchesSearch = 
        rec.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.attendantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.shiftDate.includes(searchTerm) ||
        rec.shiftName.toLowerCase().includes(searchTerm.toLowerCase());

      // Attendant filter
      const matchesAttendant = selectedAttendant === 'all' || rec.attendantId === selectedAttendant || rec.attendantName === selectedAttendant;

      // Date period filter
      let matchesPeriod = true;
      if (selectedPeriod !== 'all') {
        const recordDate = new Date(rec.shiftDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedPeriod === 'today') {
          matchesPeriod = recordDate >= today;
        } else if (selectedPeriod === 'week') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          matchesPeriod = recordDate >= sevenDaysAgo;
        } else if (selectedPeriod === 'month') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesPeriod = recordDate >= startOfMonth;
        }
      }

      return matchesSearch && matchesAttendant && matchesPeriod;
    });
  }, [allRecords, searchTerm, selectedPeriod, selectedAttendant]);

  // Key Metrics
  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

  const totalOps = filteredRecords.length;
  const avgAmount = totalOps > 0 ? totalAmount / totalOps : 0;

  // Top Attendant for Lavage & Graissage
  const topAttendant = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      totals[r.attendantName] = (totals[r.attendantName] || 0) + r.amount;
    });
    let top = { name: 'N/A', amount: 0 };
    Object.entries(totals).forEach(([name, amt]) => {
      if (amt > top.amount) {
        top = { name, amount: amt };
      }
    });
    return top;
  }, [filteredRecords]);

  // Service breakdown distribution
  const serviceDistribution = useMemo(() => {
    const dist: Record<string, { count: number; total: number }> = {};
    filteredRecords.forEach((r) => {
      const name = r.serviceName.trim() || 'Lavage / Graissage';
      if (!dist[name]) {
        dist[name] = { count: 0, total: 0 };
      }
      dist[name].count += 1;
      dist[name].total += r.amount;
    });
    return Object.entries(dist)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  // Active or Available Shifts for Quick Add
  const availableShifts = useMemo(() => {
    return [...store.shifts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.shifts]);

  // Add Service Handler
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShiftId || !newServiceName.trim() || !newServiceAmount) return;

    const shiftToUpdate = store.shifts.find((s) => s.id === targetShiftId);
    if (!shiftToUpdate) return;

    const amount = parseFloat(newServiceAmount) || 0;
    const currentServices = shiftToUpdate.servicesSold || [];
    const newService = {
      id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newServiceName.trim(),
      total: amount,
    };

    const updatedServices = [...currentServices, newService];
    store.updateShift(shiftToUpdate.id, { servicesSold: updatedServices }, store.currentRole);

    // Reset Form
    setNewServiceName('');
    setNewServiceAmount('');
    setIsAddModalOpen(false);
  };

  // Delete Service Handler
  const handleDeleteService = (shiftId: string, serviceId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet enregistrement de lavage/graissage ?')) return;

    const shiftToUpdate = store.shifts.find((s) => s.id === shiftId);
    if (!shiftToUpdate) return;

    const updatedServices = (shiftToUpdate.servicesSold || []).filter((s: any) => s.id !== serviceId);
    store.updateShift(shiftToUpdate.id, { servicesSold: updatedServices }, store.currentRole);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID Shift', 'Date', 'Shift', 'Pompiste / Employé', 'Service / Opération', 'Montant (MAD)'];
    const rows = filteredRecords.map((r) => [
      r.shiftId,
      r.shiftDate,
      r.shiftName,
      `"${r.attendantName}"`,
      `"${r.serviceName}"`,
      r.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_Lavage_Graissage_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/20 backdrop-blur-md rounded-2xl border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Gestion Lavage & Graissage</h1>
              <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Automatique
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-1">
              Historique complet et centralisé de tous les lavages & graissages enregistrés lors des shifts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (availableShifts.length > 0) {
                setTargetShiftId(availableShifts[0].id);
              }
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau Service
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Ventes</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-sans">MAD</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Chiffre d'affaires consolidé</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opérations Réalisées</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalOps} <span className="text-xs text-slate-500 font-sans">services</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Enregistrés sur vos shifts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moyenne / Service</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {avgAmount.toFixed(2)} <span className="text-xs text-slate-500 font-sans">MAD</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Panier moyen par prestation
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Pompiste</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 truncate" title={topAttendant.name}>
            {topAttendant.name}
          </div>
          <div className="mt-2 text-xs text-purple-600 font-bold font-mono">
            {topAttendant.amount.toFixed(2)} MAD de ventes
          </div>
        </div>
      </div>

      {/* Tabs and Filters Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Historique des Opérations ({filteredRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'stats' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Répartition & Statistiques
            </button>
          </div>

          {/* Period Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Période:</span>
            {[
              { id: 'all', label: 'Tout' },
              { id: 'today', label: "Aujourd'hui" },
              { id: 'week', label: '7 derniers jours' },
              { id: 'month', label: 'Ce mois' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedPeriod === p.id
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Attendant Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher service, pompiste, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedAttendant}
              onChange={(e) => setSelectedAttendant(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            >
              <option value="all">Tous les employés / pompistes</option>
              {store.attendants.map((att) => (
                <option key={att.id} value={att.id}>
                  {att.firstName} {att.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-semibold">
            <span>Affichage: <strong className="text-slate-800">{filteredRecords.length}</strong> résultats</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-4">Date & Shift</th>
                    <th className="p-4">Service / Opération</th>
                    <th className="p-4">Employé / Pompiste</th>
                    <th className="p-4">Référence Shift</th>
                    <th className="p-4 text-right">Montant (MAD)</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {rec.shiftDate}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Shift: <span className="font-semibold text-slate-700">{rec.shiftName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg font-bold">
                          <Droplets className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{rec.serviceName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {rec.attendantName}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-[11px] font-semibold">
                          #{rec.shiftId.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-black text-sm text-indigo-600">
                        +{rec.amount.toFixed(2)} <span className="text-xs font-sans text-slate-400">MAD</span>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteService(rec.shiftId, rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                          title="Supprimer cette opération"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs text-slate-700">
                  <tr>
                    <td colSpan={4} className="p-4 uppercase text-right tracking-wider text-slate-500">
                      Total Général Lavage & Graissage
                    </td>
                    <td className="p-4 text-right font-mono text-base font-black text-indigo-600">
                      {totalAmount.toFixed(2)} MAD
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Aucun enregistrement de lavage ou graissage trouvé</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Les prestations de lavage et graissage saisies lors des ouvertures/clôtures de shift apparaîtront automatiquement ici.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistics & Distribution View */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Services Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Répartition par Type de Service
            </h3>
            <div className="space-y-3">
              {serviceDistribution.length > 0 ? (
                serviceDistribution.map((srv) => {
                  const percentage = totalAmount > 0 ? (srv.total / totalAmount) * 100 : 0;
                  return (
                    <div key={srv.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{srv.name} ({srv.count} ops)</span>
                        <span className="font-mono text-indigo-600 font-bold">{srv.total.toFixed(2)} MAD ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Aucune donnée statistique disponible.</p>
              )}
            </div>
          </div>

          {/* Attendant Performance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Ventes par Pompiste / Employé
            </h3>
            <div className="space-y-3">
              {(() => {
                const attendantTotals: Record<string, { total: number; count: number }> = {};
                filteredRecords.forEach((r) => {
                  if (!attendantTotals[r.attendantName]) {
                    attendantTotals[r.attendantName] = { total: 0, count: 0 };
                  }
                  attendantTotals[r.attendantName].total += r.amount;
                  attendantTotals[r.attendantName].count += 1;
                });
                const sorted = Object.entries(attendantTotals).sort((a, b) => b[1].total - a[1].total);

                if (sorted.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-4">Aucune donnée disponible.</p>;
                }

                return sorted.map(([name, data]) => {
                  const pct = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{name} <span className="text-[10px] text-slate-400 font-normal">({data.count} ops)</span></span>
                        <span className="font-mono text-emerald-600 font-bold">{data.total.toFixed(2)} MAD</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Ajouter un Lavage / Graissage</h3>
                  <p className="text-xs text-slate-400">Associer la vente à un shift existant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shift de Destination
                </label>
                <select
                  value={targetShiftId}
                  onChange={(e) => setTargetShiftId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {availableShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} - {s.shiftName} ({s.attendantName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du Service / Opération
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lavage Complet, Graissage Moteur..."
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant Total (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newServiceAmount}
                  onChange={(e) => setNewServiceAmount(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
