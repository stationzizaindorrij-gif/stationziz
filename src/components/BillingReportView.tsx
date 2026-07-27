import React, { useState, useRef } from 'react';
import { RichDocument, DocumentSettings } from './BillingTypes';
import { Client, Supplier } from '../types';
import { Printer, Download, FileSpreadsheet, Calendar, Filter, FileText, Search, RefreshCw, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface BillingReportViewProps {
  documents: RichDocument[];
  settings: DocumentSettings;
  clients: Client[];
  suppliers: Supplier[];
  onBack?: () => void;
}

const paymentMethodLabels: Record<string, string> = {
  espece: 'Espèce',
  bon_carburant: 'bon carburant',
  cheque: 'Chèque',
  virement: 'Virement',
  traite: 'Traite',
  credit: 'Crédit',
  autre: 'Autre'
};

export function BillingReportView({ documents, settings, clients, suppliers, onBack }: BillingReportViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Default dates: Start of current year to today
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfYearStr = `${new Date().getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(startOfYearStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [category, setCategory] = useState<'all' | 'client' | 'supplier'>('all');
  const [docType, setDocType] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Date Selectors
  const setQuickRange = (range: 'thisMonth' | 'thisYear' | 'all') => {
    const now = new Date();
    if (range === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (range === 'thisYear') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    // Date filter
    if (startDate && doc.date < startDate) return false;
    if (endDate && doc.date > endDate) return false;

    // Category
    if (category === 'client' && !doc.docType.startsWith('client_')) return false;
    if (category === 'supplier' && !doc.docType.startsWith('supplier_')) return false;

    // Document Type
    if (docType !== 'all' && doc.docType !== docType) return false;

    // Partner
    if (selectedPartner !== 'all') {
      if (doc.partnerId !== selectedPartner && doc.partnerName !== selectedPartner) return false;
    }

    // Payment method
    if (paymentFilter !== 'all' && doc.paymentMethod !== paymentFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = (doc.documentNumber || '').toLowerCase().includes(q);
      const matchPartner = (doc.partnerName || '').toLowerCase().includes(q);
      if (!matchNum && !matchPartner) return false;
    }

    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Totals
  const totalHT = filteredDocs.reduce((acc, d) => acc + (d.amountHT || 0), 0);
  const totalTVA = filteredDocs.reduce((acc, d) => acc + (d.vatAmount || 0), 0);
  const totalTTC = filteredDocs.reduce((acc, d) => acc + (d.amountTTC || 0), 0);

  // Formatted date string for print footer
  const currentFormattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Helper date formatter: YYYY-MM-DD -> DD/MM/YYYY
  const formatDateFR = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper number formatter: 1356982.2 -> "1 356 982,20"
  const formatAmount = (num: number) => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Handle Download PDF via html2pdf
  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Rapport_Facturation_${startDate || 'debut'}_au_${endDate || 'fin'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    try {
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  // Handle Print via window.open with full style extraction
  const handlePrint = () => {
    const content = reportRef.current?.innerHTML;
    if (!content) {
      window.print();
      return;
    }

    const headHtml = Array.from(window.document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => (el as HTMLElement).outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport de Facturation - ${settings.companyName || 'Station Ziz'}</title>
          <meta charset="utf-8" />
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
                padding: 0 !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .printable-report {
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 12mm 15mm 12mm 15mm !important;
                box-sizing: border-box !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                background-color: white !important;
              }
            }
            body {
              background-color: white !important;
              margin: 0;
              padding: 0;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="printable-report bg-white text-slate-900 leading-relaxed font-sans">
            ${content}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error("Print error:", e);
      }
    }, 400);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['DATE', 'N° Facture', 'CLIENT/TIERS', 'Mode de Règlement', 'Montant HT (DH)', 'TVA (DH)', 'Montant TTC (DH)'];
    const rows = filteredDocs.map((d) => [
      formatDateFR(d.date),
      d.documentNumber,
      `"${d.partnerName.replace(/"/g, '""')}"`,
      paymentMethodLabels[d.paymentMethod] || d.paymentMethod,
      d.amountHT.toFixed(2),
      d.vatAmount.toFixed(2),
      d.amountTTC.toFixed(2)
    ]);

    rows.push(['TOTAL', '', '', '', totalHT.toFixed(2), totalTVA.toFixed(2), totalTTC.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_Facturation_${startDate || 'debut'}_au_${endDate || 'fin'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Filter & Action Bar (Hidden on Print) */}
      <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Rapport de Facturation
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Générez et imprimez la liste récapitulative des pièces comptables par période
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimer le Rapport
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {/* Date Start */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-600" /> Date Début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Date End */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-600" /> Date Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-600" /> Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setDocType('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="all">Toutes les pièces</option>
              <option value="client">Documents Clients</option>
              <option value="supplier">Documents Fournisseurs</option>
            </select>
          </div>

          {/* Document Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Type de Pièce</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="client_facture">Facture Client</option>
              <option value="client_devis">Devis Client</option>
              <option value="client_bl">Bon de Livraison Client</option>
              <option value="client_avoir">Avoir Client</option>
            </select>
          </div>

          {/* Partner Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client / Fournisseur</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="all">Tous les tiers</option>
              <optgroup label="Clients">
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Fournisseurs">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Période Rapide</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQuickRange('thisMonth')}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition-all"
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => setQuickRange('thisYear')}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-black rounded-lg transition-all"
              >
                Année
              </button>
              <button
                type="button"
                onClick={() => setQuickRange('all')}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition-all"
              >
                Tout
              </button>
            </div>
          </div>
        </div>

        {/* Search bar & Stats badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par N° ou Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="text-xs font-bold text-slate-600 flex items-center gap-4">
            <span>
              Total pièces: <strong className="text-indigo-600">{filteredDocs.length}</strong>
            </span>
            <span>
              Montant TTC: <strong className="text-slate-900">{formatAmount(totalTTC)} MAD</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Custom print CSS fallback */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-report, .printable-report * {
            visibility: visible !important;
          }
          .printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Printable Report Document Container */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl flex justify-center print:p-0 print:bg-white">
        <div
          ref={reportRef}
          className="printable-report bg-white text-slate-900 w-full max-w-[210mm] p-8 sm:p-12 rounded-xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none text-[11px] font-sans leading-relaxed flex flex-col justify-between min-h-[297mm]"
        >
          <div>
            {/* Header Station Info & Logo */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 gap-4">
              <div className="space-y-1 max-w-[70%]">
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 font-sans">
                  {settings.companyName || 'STATION ZIZ SERVICE'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-600 uppercase font-sans">
                  {settings.address || 'AIN DORRIJ CENTRE LAMJAARA OUEZZANE'}
                </p>
                {(settings.phone || settings.email) && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    {settings.phone && <span>Tél: {settings.phone}</span>}
                    {settings.phone && settings.email && <span> • </span>}
                    {settings.email && <span>Email: {settings.email}</span>}
                  </p>
                )}
                {/* Tax & Business IDs bar */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 mt-2">
                  {settings.ice && <span><strong>ICE:</strong> {settings.ice}</span>}
                  {settings.ifNum && <span><strong>IF:</strong> {settings.ifNum}</span>}
                  {settings.rc && <span><strong>RC:</strong> {settings.rc}</span>}
                  {settings.patente && <span><strong>Patente:</strong> {settings.patente}</span>}
                  {settings.cnss && <span><strong>CNSS:</strong> {settings.cnss}</span>}
                </div>
              </div>

              {/* Logo if available */}
              {settings.logoUrl ? (
                <div className="flex-shrink-0">
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="h-16 w-auto object-contain max-w-[140px]"
                  />
                </div>
              ) : (
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-900 text-white rounded uppercase tracking-wider">
                    DOCUMENT COMPTABLE
                  </span>
                </div>
              )}
            </div>

            {/* Document Title / Subtitle Banner */}
            <div className="text-center my-6 bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
              <h2 className="text-base font-black tracking-widest uppercase font-sans text-slate-900">
                Rapport Des Pièces Comptables
              </h2>
              <div className="mt-1.5 inline-block bg-white border border-slate-200 px-3 py-0.5 rounded-full text-[10px] font-bold text-slate-700 shadow-2xs">
                {startDate && endDate
                  ? `Période du ${formatDateFR(startDate)} au ${formatDateFR(endDate)}`
                  : startDate
                  ? `À partir du ${formatDateFR(startDate)}`
                  : endDate
                  ? `Jusqu'au ${formatDateFR(endDate)}`
                  : 'Toutes les périodes'}
              </div>
            </div>

            {/* Main Table */}
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-300">
              <table className="w-full border-collapse text-[10px] font-sans">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase text-left tracking-wider">
                    <th className="py-2.5 px-2 text-left w-[12%] border-r border-slate-800">DATE</th>
                    <th className="py-2.5 px-2 text-left w-[14%] border-r border-slate-800">N° Facture</th>
                    <th className="py-2.5 px-2 text-left w-[32%] border-r border-slate-800">CLIENT / TIERS</th>
                    <th className="py-2.5 px-2 text-left w-[14%] border-r border-slate-800">Règlement</th>
                    <th className="py-2.5 px-2 text-right w-[12%] border-r border-slate-800">Montant HT</th>
                    <th className="py-2.5 px-2 text-right w-[6%] border-r border-slate-800">TVA</th>
                    <th className="py-2.5 px-2 text-right w-[10%]">MONTANT TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center italic text-slate-400 font-sans">
                        Aucune pièce comptable trouvée pour la période sélectionnée.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc, idx) => (
                      <tr key={doc.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-2 font-mono text-[9.5px] text-slate-700 border-r border-slate-100">
                          {formatDateFR(doc.date)}
                        </td>
                        <td className="py-2 px-2 font-mono text-[9.5px] font-bold text-slate-800 border-r border-slate-100">
                          {doc.documentNumber}
                        </td>
                        <td className="py-2 px-2 font-bold uppercase text-slate-900 border-r border-slate-100 truncate max-w-[220px]">
                          {doc.partnerName}
                        </td>
                        <td className="py-2 px-2 italic text-slate-700 text-[9.5px] border-r border-slate-100">
                          {paymentMethodLabels[doc.paymentMethod] || doc.paymentMethod || 'Espèce'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[9.5px] text-slate-800 border-r border-slate-100">
                          {formatAmount(doc.amountHT || 0)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[9.5px] text-slate-800 border-r border-slate-100">
                          {formatAmount(doc.vatAmount || 0)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[9.5px] font-black text-slate-900">
                          {formatAmount(doc.amountTTC || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section & Stamp Box */}
            {filteredDocs.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-6">
                {/* Left side: Visa / Stamp box */}
                <div className="border border-slate-300 rounded-xl p-3 w-56 min-h-[90px] flex flex-col justify-between bg-white relative overflow-hidden">
                  <p className="text-[9px] font-black uppercase text-center text-slate-400 border-b border-slate-100 pb-1 mb-1">
                    Visa et Cachet
                  </p>
                  <div className="flex-1 flex items-center justify-center py-1">
                    {settings.stampUrl && (settings.stampUrl.startsWith('data:image/') || settings.stampUrl.startsWith('http') || settings.stampUrl.length > 20) ? (
                      <img 
                        src={settings.stampUrl} 
                        alt="Visa et Cachet" 
                        className="max-h-16 max-w-full object-contain" 
                      />
                    ) : settings.showStamp && settings.stampText ? (
                      <div className={`p-2 border-2 border-dashed rounded-lg text-center font-black text-[10px] uppercase rotate-[-3deg] ${
                        settings.stampColor === 'red' ? 'border-rose-600 text-rose-600 bg-rose-50/50' : 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      }`}>
                        <p>{settings.stampText}</p>
                        <p className="text-[7px] font-mono opacity-80 mt-0.5">{settings.companyName || 'SIGNÉ & VALIDE'}</p>
                      </div>
                    ) : (
                      <div className="h-8 text-[8px] text-slate-300 font-sans italic flex items-center justify-center">
                        Signature & Cachet
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Totals Summary Table */}
                <div className="w-full sm:w-72 bg-slate-50 border border-slate-300 rounded-xl overflow-hidden font-sans">
                  <div className="bg-slate-800 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-center">
                    Récapitulatif Financièr
                  </div>
                  <div className="p-3 space-y-1.5 text-[10.5px]">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Total HT :</span>
                      <span className="font-mono font-bold">{formatAmount(totalHT)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 pb-1.5 border-b border-slate-200">
                      <span className="font-semibold">Total TVA :</span>
                      <span className="font-mono font-bold">{formatAmount(totalTVA)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-900 pt-1 font-black bg-slate-900 text-white -mx-3 -mb-3 p-3">
                      <span className="uppercase text-xs tracking-wider">TOTAL TTC :</span>
                      <span className="font-mono text-sm">{formatAmount(totalTTC)} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Date generated & Page number) */}
          <div className="mt-12 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] font-medium text-slate-500 font-sans">
            <div>
              <span>Édité le {currentFormattedDate}</span>
            </div>
            <div className="font-semibold text-slate-700">
              <span>{settings.companyName || 'Station Service ERP'}</span>
            </div>
            <div>
              <span>Page 1 / 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
