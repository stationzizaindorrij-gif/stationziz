import React, { useState, useMemo } from 'react';
import { Wallet, Search, Filter, Calendar, Users, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Shift, Attendant } from '../types';

export function ExpensesModule({ store }: { store: any }) {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
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
            date: shift.date,
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

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const matchesAttendant = selectedAttendant ? exp.attendantId === selectedAttendant : true;
      const matchesSearch = 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.attendantName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAttendant && matchesSearch;
    });
  }, [allExpenses, selectedAttendant, searchTerm]);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Suivi des Dépenses</h1>
          <p className="text-sm text-slate-500">Consultez l'historique et les détails de toutes les dépenses enregistrées lors des shifts.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Dépenses</p>
            <p className="text-xl font-black text-rose-600">{totalExpenses.toFixed(2)} DH</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par description, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="sm:w-64 relative">
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
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold">{new Date(exp.date).toLocaleDateString('fr-FR')}</p>
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
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
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
                      <p className="text-sm mt-1">Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
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
