import React, { useState, useMemo, useRef } from 'react';
import { Wallet, Search, Filter, Calendar, Users, FileText, ArrowDownRight, ArrowUpRight, X, CalendarDays, RefreshCw, Printer, CreditCard, Tag, DollarSign, Building2 } from 'lucide-react';
import { Shift, Attendant, StationConfig } from '../types';

export function ExpensesModule({ store }: { store: any }) {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { shifts, attendants, config } = store as { shifts: Shift[], attendants: Attendant[], config?: StationConfig };

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
            type: exp.type || 'Général',
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
      
      let matchesDate = true;
      if (selectedDate && selectedEndDate) {
        matchesDate = expDateOnly >= selectedDate && expDateOnly <= selectedEndDate;
      } else if (selectedDate) {
        matchesDate = expDateOnly >= selectedDate;
      } else if (selectedEndDate) {
        matchesDate = expDateOnly <= selectedEndDate;
      }

      const matchesAttendant = selectedAttendant ? exp.attendantId === selectedAttendant : true;
      const matchesSearch = 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.attendantName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDate && matchesAttendant && matchesSearch;
    });
  }, [allExpenses, selectedDate, selectedEndDate, selectedAttendant, searchTerm]);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStartOfMonthFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const clearAllFilters = () => {
    setSelectedDate('');
    setSelectedEndDate('');
    setSelectedAttendant('');
    setSearchTerm('');
  };

  const isFiltered = Boolean(selectedDate || selectedEndDate || selectedAttendant || searchTerm);

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Group by category/type for print report
  const categoryTotals = useMemo(() => {
    const totals: { [type: string]: { amount: number; count: number } } = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.type || 'Autre';
      if (!totals[cat]) {
        totals[cat] = { amount: 0, count: 0 };
      }
      totals[cat].amount += exp.amount;
      totals[cat].count += 1;
    });
    return Object.entries(totals).sort((a, b) => b[1].amount - a[1].amount);
  }, [filteredExpenses]);

  // Group by payment method
  const methodTotals = useMemo(() => {
    const totals: { cash: number; card: number; other: number } = { cash: 0, card: 0, other: 0 };
    filteredExpenses.forEach(exp => {
      if (exp.method === 'cash') totals.cash += exp.amount;
      else if (exp.method === 'card') totals.card += exp.amount;
      else totals.other += exp.amount;
    });
    return totals;
  }, [filteredExpenses]);

  const handlePrintInNewWindow = () => {
    const content = reportRef.current?.innerHTML;
    if (!content) return;

    const headHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1000,height=850');
    if (!printWindow) {
      window.print();
      return;
    }

    const stationTitle = config?.name || 'STATION SERVICE ATLAS';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Rapport des Dépenses - ${stationTitle}</title>
          ${headHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 12mm 15mm !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .printable-expense-report {
              box-shadow: none !important;
              border: none !important;
              padding: 12mm 15mm !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              min-height: 297mm !important;
              height: 297mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              background: white !important;
            }
          </style>
        </head>
        <body>
          <div class="printable-expense-report">
            ${content}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Suivi des Dépenses</h1>
          <p className="text-sm text-slate-500">Consultez l'historique, filtrez par période et imprimez vos rapports de dépenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Rapport</span>
          </button>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">
                Total Dépenses
              </p>
              <p className="text-xl font-black text-rose-600">{formatAmount(totalExpenses)} DH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par description, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
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

          {/* Date Début */}
          <div className="md:col-span-3 relative">
            <div className="relative w-full">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Du"
                title="Date de début"
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Date Fin */}
          <div className="md:col-span-3 relative">
            <div className="relative w-full">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
              <input
                type="date"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
                placeholder="Au"
                title="Date de fin"
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              />
              {selectedEndDate && (
                <button
                  onClick={() => setSelectedEndDate('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Attendant Selection */}
          <div className="md:col-span-2 relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedAttendant}
              onChange={(e) => setSelectedAttendant(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer truncate"
            >
              <option value="">Tous pompistes</option>
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
              Période :
            </span>
            <button
              onClick={() => { setSelectedDate(''); setSelectedEndDate(''); }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !selectedDate && !selectedEndDate
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toutes les dates
            </button>
            <button
              onClick={() => {
                const today = getTodayFormatted();
                setSelectedDate(today);
                setSelectedEndDate(today);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDate === getTodayFormatted() && selectedEndDate === getTodayFormatted()
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => {
                setSelectedDate(getStartOfMonthFormatted());
                setSelectedEndDate(getTodayFormatted());
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDate === getStartOfMonthFormatted() && selectedEndDate === getTodayFormatted()
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ce mois-ci
            </button>

            {datesWithExpenses.slice(0, 4).map(({ date, count }) => {
              const isSelected = selectedDate === date && selectedEndDate === date;
              const formattedLabel = formatDateDisplay(date);
              return (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedEndDate(date);
                  }}
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
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
        <div>
          Affichage de <span className="font-bold text-slate-800">{filteredExpenses.length}</span> dépense(s) sur <span className="font-bold text-slate-800">{allExpenses.length}</span> au total
        </div>
        {(selectedDate || selectedEndDate) && (
          <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Filtre Période : <strong>
                {selectedDate && selectedEndDate && selectedDate === selectedEndDate
                  ? formatDateDisplay(selectedDate)
                  : `${selectedDate ? formatDateDisplay(selectedDate) : 'Début'} au ${selectedEndDate ? formatDateDisplay(selectedEndDate) : 'Aujourd\'hui'}`
                }
              </strong>
            </span>
            <button onClick={() => { setSelectedDate(''); setSelectedEndDate(''); }} className="ml-1 text-indigo-500 hover:text-indigo-800">
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
                            {exp.date ? formatDateDisplay(exp.date.split('T')[0]) : '-'}
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
                        {exp.method === 'cash' ? 'Espèce' : 'Carte / Autre'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-rose-600">
                        -{formatAmount(exp.amount)} DH
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
                          ? `Aucune dépense enregistrée pour la période sélectionnée.`
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

      {/* PRINTABLE EXPENSE REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header Controls (hidden when printing) */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Aperçu du Rapport des Dépenses</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInNewWindow}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white">
              <div ref={reportRef} className="printable-expense-report bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none text-[11px] font-sans leading-relaxed flex flex-col justify-between min-h-[297mm]">
                <style>{`
                  @page {
                    size: A4 portrait;
                    margin: 0 !important;
                  }
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 0 !important;
                    }
                    html, body {
                      margin: 0 !important;
                      padding: 0 !important;
                      background-color: white !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    body * {
                      visibility: hidden !important;
                    }
                    .printable-expense-report, .printable-expense-report * {
                      visibility: visible !important;
                    }
                    .printable-expense-report {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      min-height: 297mm !important;
                      height: 297mm !important;
                      box-sizing: border-box !important;
                      display: flex !important;
                      flex-direction: column !important;
                      justify-content: space-between !important;
                      margin: 0 !important;
                      padding: 12mm 15mm !important;
                      box-shadow: none !important;
                      border: none !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                `}</style>

                <div className="flex-1 flex flex-col justify-start">
                  {/* Document Title Banner */}
                  <div className="text-center mb-4 bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600"></div>
                    <h2 className="text-xl font-black uppercase text-slate-900 tracking-wider">
                      RAPPORT DES DÉPENSES
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 mt-1 font-mono">
                      {selectedDate && selectedEndDate && selectedDate === selectedEndDate ? (
                        <>Date : {formatDateDisplay(selectedDate)}</>
                      ) : selectedDate || selectedEndDate ? (
                        <>Période du {selectedDate ? formatDateDisplay(selectedDate) : 'Début'} au {selectedEndDate ? formatDateDisplay(selectedEndDate) : formatDateDisplay(getTodayFormatted())}</>
                      ) : (
                        <>Période Globale (Toutes les dates)</>
                      )}
                      {selectedAttendant && (
                        <span className="ml-3 text-indigo-600">
                          • Pompiste : {attendants.find(a => a.id === selectedAttendant)?.firstName} {attendants.find(a => a.id === selectedAttendant)?.lastName}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3 my-4 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Nombre de dépense(s)</p>
                      <p className="text-base font-mono font-black text-slate-900 mt-0.5">{filteredExpenses.length}</p>
                    </div>
                    <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                      <p className="text-[9px] font-bold text-rose-700 uppercase">Total Dépenses</p>
                      <p className="text-base font-mono font-black text-rose-600 mt-0.5">{formatAmount(totalExpenses)} MAD</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Payé en Espèces</p>
                      <p className="text-base font-mono font-black text-emerald-700 mt-0.5">{formatAmount(methodTotals.cash)} MAD</p>
                    </div>
                  </div>

                  {/* Category Breakdown if applicable */}
                  {categoryTotals.length > 0 && (
                    <div className="my-4">
                      <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Répartition par type de dépense</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categoryTotals.map(([cat, data]) => (
                          <div key={cat} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800 text-[10px]">{cat}</p>
                              <p className="text-[8.5px] text-slate-500">{data.count} opération(s)</p>
                            </div>
                            <span className="font-mono font-bold text-rose-600 text-[11px]">{formatAmount(data.amount)} MAD</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expense Items Table */}
                  <div className="my-4 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[10px] font-sans">
                      <thead className="bg-slate-900 text-white font-bold uppercase text-[8.5px] tracking-wider">
                        <tr>
                          <th className="p-2.5 text-center w-8">#</th>
                          <th className="p-2.5">Date & Shift</th>
                          <th className="p-2.5">Pompiste</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-center">Méthode</th>
                          <th className="p-2.5 text-right">Montant (MAD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredExpenses.length > 0 ? (
                          filteredExpenses.map((exp, idx) => (
                            <tr key={exp.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-2.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                <div>{exp.date ? formatDateDisplay(exp.date.split('T')[0]) : '-'}</div>
                                <div className="text-[8.5px] text-slate-500 font-normal">{exp.shiftName}</div>
                              </td>
                              <td className="p-2.5 font-medium text-slate-800">{exp.attendantName}</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[8.5px]">
                                  {exp.type}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-700 max-w-[180px]">{exp.description}</td>
                              <td className="p-2.5 text-center uppercase text-[8.5px] font-bold">
                                {exp.method === 'cash' ? 'Espèce' : 'Carte'}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                -{formatAmount(exp.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                              Aucune dépense à afficher pour cette sélection.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Horizontal Totals Banner */}
                  {filteredExpenses.length > 0 && (
                    <div className="mt-4 w-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-sm font-sans border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 items-center text-center p-3">
                        <div className="py-1 px-3 flex items-center justify-center sm:justify-start">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                            TOTAL DÉPENSES :
                          </span>
                        </div>
                        <div className="py-1 px-3 flex flex-col items-center">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                            Nombre d'opérations
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            {filteredExpenses.length}
                          </span>
                        </div>
                        <div className="py-1 px-3 flex flex-col items-center bg-rose-950/40">
                          <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider mb-0.5">
                            Montant Total
                          </span>
                          <span className="text-sm font-mono font-black text-rose-400">
                            {formatAmount(totalExpenses)} MAD
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer timestamp */}
                <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center text-[8.5px] text-slate-400 font-mono">
                  <div>Édité le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  <div>Rapport de Dépenses ERP</div>
                  <div>Page 1 / 1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesModule;

