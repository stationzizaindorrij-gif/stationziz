import React, { useState, useMemo } from 'react';
import { Wallet, Search, Filter, Calendar, Users, FileText, ArrowDownRight, ArrowUpRight, X, CalendarDays, RefreshCw } from 'lucide-react';
import { Shift, Attendant } from '../types';

export function ExpensesModule({ store }: { store: any }) {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { shifts, attendants } = store as { shifts: Shift[], attendants: Attendant[] };

  // Flatten all expenses from all shifts
  const allExpenses = useMemo(() => {
    const expensesList: Array<{
      id: string;
      date: string;
      shiftId: string;
      shiftName: string;
      attendantId: string;
      attendantName: string;
      type: string;
      description: string;
      amount: number;
      method: string;
    }> = [];

    shifts.forEach(shift => {
      if (shift.expenses && shift.expenses.length > 0) {
        shift.expenses.forEach((exp: any) => {
          expensesList.push({
            id: exp.id || Math.random().toString(),
            date: exp.date || shift.date || '',
            shiftId: shift.id,
            shiftName: shift.shiftName,
            attendantId: shift.attendantId,
            attendantName: shift.attendantName,
            type: exp.type || '-',
            description: exp.description || '-',
            amount: exp.amount || 0,
            method: exp.method || 'cash',
          });
        });
      }
    });

    return expensesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shifts]);

  // Extract list of dates that actually have expenses recorded
  const datesWithExpenses = useMemo(() => {
    const counts: { [date: string]: number } = {};
    allExpenses.forEach(exp => {
      const dateFormatted = exp.date ? exp.date.split('T')[0] : '';
      if (dateFormatted) {
        counts[dateFormatted] = (counts[dateFormatted] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const expDateOnly = exp.date ? exp.date.split('T')[0] : '';
      const matchesDate = selectedDate ? expDateOnly === selectedDate : true;
      const matchesAttendant = selectedAttendant ? exp.attendantId === selectedAttendant : true;
      const matchesSearch = 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.attendantName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDate && matchesAttendant && matchesSearch;
    });
  }, [allExpenses, selectedDate, selectedAttendant, searchTerm]);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const clearAllFilters = () => {
    setSelectedDate('');
    setSelectedAttendant('');
    setSearchTerm('');
  };

  const isFiltered = Boolean(selectedDate || selectedAttendant || searchTerm);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Suivi des Dépenses</h1>
          <p className="text-sm text-slate-500">Consultez l'historique et filtrez par date exacte, pompiste ou mot-clé.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Dépenses {selectedDate ? `(${new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')})` : ''}
            </p>
            <p className="text-xl font-black text-rose-600">{totalExpenses.toFixed(2)} DH</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par description, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Exact Date Selection */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center">
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                />
                {selectedDate ? (
                  <button
                    onClick={() => setSelectedDate('')}
                    title="Effacer la date sélectionnée"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Attendant Selection */}
          <div className="md:col-span-3 relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedAttendant}
              onChange={(e) => setSelectedAttendant(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Tous les pompistes</option>
              {attendants.map(att => (
                <option key={att.id} value={att.id}>{att.firstName} {att.lastName}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Quick Date Shortcuts & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              Raccourcis date :
            </span>
            <button
              onClick={() => setSelectedDate('')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !selectedDate
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toutes les dates
            </button>
            <button
              onClick={() => setSelectedDate(getTodayFormatted())}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDate === getTodayFormatted()
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Aujourd'hui
            </button>

            {datesWithExpenses.slice(0, 5).map(({ date, count }) => {
              const isSelected = selectedDate === date;
              const formattedLabel = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <span>{formattedLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-200/60 text-indigo-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Results summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Affichage de <span className="font-bold text-slate-800">{filteredExpenses.length}</span> dépense(s) sur <span className="font-bold text-slate-800">{allExpenses.length}</span> au total
        </div>
        {selectedDate && (
          <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Filtre Date Exacte : <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}</strong></span>
            <button onClick={() => setSelectedDate('')} className="ml-1 text-indigo-500 hover:text-indigo-800">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date & Shift</th>
                <th className="px-6 py-4">Pompiste</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Méthode</th>
                <th className="px-6 py-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {exp.date ? new Date(exp.date.split('T')[0] + 'T00:00:00').toLocaleDateString('fr-FR') : '-'}
                          </p>
                          <p className="text-xs text-slate-500">{exp.shiftName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {exp.attendantName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{exp.attendantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        exp.method === 'cash' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {exp.method === 'cash' ? 'Espèce' : 'Carte'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-rose-600">
                        -{exp.amount.toFixed(2)} DH
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">Aucune dépense trouvée</p>
                      <p className="text-sm mt-1 text-slate-500">
                        {selectedDate 
                          ? `Aucune dépense enregistrée pour la date du ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}.`
                          : 'Modifiez vos filtres ou effectuez une nouvelle recherche.'
                        }
                      </p>
                      {isFiltered && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Réinitialiser tous les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ExpensesModule;
