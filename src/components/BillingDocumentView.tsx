import React, { useRef, useState } from 'react';
import { RichDocument, DocumentSettings } from './BillingTypes';
import { Client, Supplier } from '../types';
import { numberToWordsFR } from '../lib/numberToWords';
import { 
  Printer, Download, Mail, X, Check, Edit3, Trash2, 
  ArrowLeft, CheckCircle2, ShieldCheck, MailQuestion, Send,
  Building2, User, MapPin, Calendar, Phone, Fuel, Info
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

function parseOklch(l: number, c: number, h: number, a: number = 1): string {
  if (c < 0.015) {
    const val = Math.round(l * 255);
    return `rgba(${val}, ${val}, ${val}, ${a})`;
  }
  let r = 0, g = 0, b = 0;
  if (h >= 340 || h < 20) {
    r = 239; g = 68; b = 68;
  } else if (h >= 20 && h < 50) {
    r = 249; g = 115; b = 22;
  } else if (h >= 50 && h < 90) {
    r = 245; g = 158; b = 11;
  } else if (h >= 90 && h < 165) {
    r = 34; g = 197; b = 94;
  } else if (h >= 165 && h < 200) {
    r = 20; g = 184; b = 166;
  } else if (h >= 200 && h < 280) {
    r = 59; g = 130; b = 246;
  } else {
    r = 168; g = 85; b = 247;
  }
  if (l > 0.5) {
    const factor = (l - 0.5) * 2;
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
  } else {
    const factor = l * 2;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function parseOklab(l: number, a: number, b: number, alpha: number = 1): string {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return parseOklch(l, c, h, alpha);
}

function safeParseFloat(val: string, fallback = 0): number {
  if (!val || val.trim().toLowerCase() === 'none') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

function convertOklchOklabToRgb(val: string): string {
  let result = val.replace(/oklch\(([^)]+)\)/gi, (_, inner) => {
    try {
      const parts = inner.trim().split(/[\s,/]+/);
      if (parts.length >= 3) {
        const lVal = parts[0];
        const cVal = parts[1];
        const hVal = parts[2];
        const aVal = parts[3];

        const l = lVal.endsWith('%') ? safeParseFloat(lVal) / 100 : safeParseFloat(lVal);
        const c = cVal.endsWith('%') ? (safeParseFloat(cVal) / 100) * 0.4 : safeParseFloat(cVal);
        const h = hVal.endsWith('deg') ? safeParseFloat(hVal.slice(0, -3)) : safeParseFloat(hVal);
        
        let alpha = 1;
        if (aVal) {
          alpha = aVal.endsWith('%') ? safeParseFloat(aVal) / 100 : safeParseFloat(aVal);
        }
        return parseOklch(l, c, h, alpha);
      }
    } catch (e) {}
    return 'rgba(100, 116, 139, 1)';
  });

  result = result.replace(/oklab\(([^)]+)\)/gi, (_, inner) => {
    try {
      const parts = inner.trim().split(/[\s,/]+/);
      if (parts.length >= 3) {
        const lVal = parts[0];
        const aVal = parts[1];
        const bVal = parts[2];
        const alphaVal = parts[3];

        const l = lVal.endsWith('%') ? safeParseFloat(lVal) / 100 : safeParseFloat(lVal);
        const a = aVal.endsWith('%') ? (safeParseFloat(aVal) / 100) * 0.4 : safeParseFloat(aVal);
        const b = bVal.endsWith('%') ? (safeParseFloat(bVal) / 100) * 0.4 : safeParseFloat(bVal);
        
        let alpha = 1;
        if (alphaVal) {
          alpha = alphaVal.endsWith('%') ? safeParseFloat(alphaVal) / 100 : safeParseFloat(alphaVal);
        }
        return parseOklab(l, a, b, alpha);
      }
    } catch (e) {}
    return 'rgba(100, 116, 139, 1)';
  });

  return result;
}

function getLightAccentColor(hex: string, alpha: number): string {
  if (!hex) return `rgba(79, 70, 229, ${alpha})`;
  if (hex.startsWith('#')) {
    const h = hex.replace('#', '');
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return hex;
}

interface BillingDocumentViewProps {
  document: RichDocument;
  settings: DocumentSettings;
  clients?: Client[];
  suppliers?: Supplier[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (newStatus: RichDocument['status']) => void;
}

export function BillingDocumentView({
  document,
  settings,
  clients,
  suppliers,
  onClose,
  onEdit,
  onDelete,
  onStatusChange
}: BillingDocumentViewProps) {
  
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [emailStatus, setEmailStatus] = React.useState<'idle' | 'sending' | 'sent'>('idle');
  const [showPdfGuide, setShowPdfGuide] = React.useState(false);

  const generateLegacyPDF = () => {
    const element = printAreaRef.current;
    if (!element) return;

    // Override global window.getComputedStyle to translate any oklch/oklab styles to rgb/rgba
    const originalGlobalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
      const style = originalGlobalGetComputedStyle(el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (/oklch/i.test(val) || /oklab/i.test(val))) {
                return convertOklchOklabToRgb(val);
              }
              return val;
            };
          }
          if (typeof prop === 'string') {
            const val = target[prop as any];
            if (typeof val === 'string' && (/oklch/i.test(val) || /oklab/i.test(val))) {
              return convertOklchOklabToRgb(val);
            }
          }
          const val = Reflect.get(target, prop);
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };

    const opt = {
      margin: 12,
      filename: `${document.docType.toUpperCase()}-${document.documentNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: false,
        onclone: (clonedDoc: Document) => {
          const clonedWindow = clonedDoc.defaultView;
          if (clonedWindow) {
            try {
              const originalGetComputedStyle = clonedWindow.getComputedStyle;
              clonedWindow.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
                const style = originalGetComputedStyle(el, pseudoElt);
                return new Proxy(style, {
                  get(target, prop) {
                    if (prop === 'getPropertyValue') {
                      return function (propertyName: string) {
                        const val = target.getPropertyValue(propertyName);
                        if (typeof val === 'string' && (/oklch/i.test(val) || /oklab/i.test(val))) {
                          return convertOklchOklabToRgb(val);
                        }
                        return val;
                      };
                    }
                    if (typeof prop === 'string') {
                      const val = target[prop as any];
                      if (typeof val === 'string' && (/oklch/i.test(val) || /oklab/i.test(val))) {
                        return convertOklchOklabToRgb(val);
                      }
                    }
                    const val = Reflect.get(target, prop);
                    if (typeof val === 'function') {
                      return val.bind(target);
                    }
                    return val;
                  }
                });
              };
            } catch (e) {
              console.warn("getComputedStyle override failed", e);
            }
          }

          const styleElements = clonedDoc.querySelectorAll('style');
          styleElements.forEach((style) => {
            if (style.textContent) {
              style.textContent = convertOklchOklabToRgb(style.textContent);
            }
          });
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const styleAttr = el.getAttribute('style');
            if (styleAttr && (/oklch/i.test(styleAttr) || /oklab/i.test(styleAttr))) {
              el.setAttribute('style', convertOklchOklabToRgb(styleAttr));
            }
          });
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      html2pdf().from(element).set(opt).save()
        .then(() => {
          window.getComputedStyle = originalGlobalGetComputedStyle;
        })
        .catch((err: any) => {
          console.error("PDF generation failed:", err);
          window.getComputedStyle = originalGlobalGetComputedStyle;
        });
    } catch (err) {
      console.error("PDF generation error:", err);
      window.getComputedStyle = originalGlobalGetComputedStyle;
    }
  };

  const handleDownloadPDF = () => {
    setShowPdfGuide(true);
  };

  const handlePrint = () => {
    const content = printAreaRef.current?.innerHTML;
    if (!content) return;

    const headHtml = Array.from(window.document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => (el as HTMLElement).outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("L'impression a été bloquée par votre navigateur. Veuillez autoriser les pop-ups pour ce site afin d'imprimer.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.docType.toUpperCase()} - ${document.documentNumber}</title>
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
                height: 297mm !important;
                width: 210mm !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-page {
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 15mm 20mm 15mm 20mm !important;
                box-sizing: border-box !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                background-color: white !important;
              }
              .no-print { display: none !important; }
            }
            body {
              background-color: white !important;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-page bg-white text-left leading-relaxed text-slate-800" style="font-family: ${settings.fontFamily}; margin: 0 auto;">
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

  const handleSendEmail = () => {
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
      setTimeout(() => setEmailStatus('idle'), 3000);
    }, 1500);
  };

  // Human friendly label for document types
  const getDocTypeLabel = () => {
    switch(document.docType) {
      case 'client_devis': return 'DEVIS';
      case 'client_facture': return 'FACTURE';
      case 'client_bl': return 'BON DE LIVRAISON';
      case 'supplier_devis_req': return 'DEMANDE DE DEVIS';
      case 'supplier_br': return 'BON DE RÉCEPTION';
      case 'supplier_facture': return 'FACTURE FOURNISSEUR';
      default: return 'DOCUMENT COMMERCIAL';
    }
  };

  const getDocNumberLabel = () => {
    switch(document.docType) {
      case 'client_devis': return 'Devis N° :';
      case 'client_facture': return 'Facture N° :';
      case 'client_bl': return 'BL N° :';
      case 'supplier_devis_req': return 'Demande N° :';
      case 'supplier_br': return 'BR N° :';
      case 'supplier_facture': return 'Facture N° :';
      default: return 'Facture N° :';
    }
  };

  const getAmountInWordsPhrase = () => {
    switch(document.docType) {
      case 'client_devis': return 'Arrêté le présent devis à la somme de :';
      case 'client_facture': return 'Arrêté la présente facture à la somme de :';
      case 'client_bl': return 'Arrêté le présent bon de livraison à la somme de :';
      case 'supplier_devis_req': return 'Arrêté la présente demande à la somme de :';
      case 'supplier_br': return 'Arrêté le présent bon de réception à la somme de :';
      case 'supplier_facture': return 'Arrêté la présente facture à la somme de :';
      default: return 'Arrêté le présent document à la somme de :';
    }
  };

  const paymentLabelMap: Record<string, string> = {
    virement: 'Virement Bancaire',
    carte: 'Carte Bancaire (TPE)',
    cheque: 'Chèque',
    especes: 'Espèces',
    credit: 'Compte Crédit Client',
    mixed: 'Paiement Mixte / Multiple'
  };

  const columnsHeaderMap: Record<string, string> = {
    code: 'Réf',
    name: 'Désignation',
    description: 'Description',
    qty: 'Qté',
    price: 'P.U. HT (Dh)',
    discount: 'Rem. %',
    vat: 'TVA %',
    totalHT: 'HT Net',
    totalTTC: 'TTC Net'
  };

  const isClientDoc = ['client_devis', 'client_facture', 'client_bl'].includes(document.docType);
  const partner = isClientDoc 
    ? clients?.find(c => c.id === document.partnerId || c.name === document.partnerName)
    : suppliers?.find(s => s.id === document.partnerId || s.name === document.partnerName);

  const displayIce = document.partnerIce || partner?.ice;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* View Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs gap-3">
        
        {/* Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Print button */}
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>

          {/* Quick status change buttons */}
          {onStatusChange && (
            <div className="h-6 w-px bg-slate-200 hidden md:block mx-2" />
          )}

          {onStatusChange && document.status === 'pending' && (
            <button
              onClick={() => onStatusChange('paid')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marquer comme Payé
            </button>
          )}

          {/* Edit / Delete action triggers */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-200 transition-all"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Main A4 Document Layout */}
      <div className="bg-slate-100 p-2 md:p-8 rounded-3xl border border-slate-200 flex justify-center shadow-inner">
        
        {/* Printable/exportable container */}
        <div 
          ref={printAreaRef}
          id="printable-document"
          className="bg-white p-8 w-full max-w-[800px] border border-slate-200 shadow-md flex flex-col aspect-[1/1.414] text-left leading-relaxed text-slate-800 relative overflow-hidden"
          style={{ fontFamily: settings.fontFamily }}
        >
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center justify-center overflow-hidden"
                style={{ 
                  width: `${settings.logoSize || 120}px`, 
                  maxWidth: '240px',
                  height: 'auto',
                  maxHeight: '120px'
                }}
              >
                {settings.logoUrl && (settings.logoUrl.startsWith('data:image/') || settings.logoUrl.startsWith('http')) ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="w-full h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: settings.primaryColor }}>
                    <Fuel className="w-8 h-8" style={{ color: settings.primaryColor }} />
                  </div>
                )}
              </div>
            </div>

            {/* Slanted Document Title */}
            <div className="relative -mr-8 -mt-8">
              <div 
                className="text-white pt-6 pb-8 pl-14 pr-10 relative z-10"
                style={{ 
                  clipPath: 'polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)',
                  backgroundColor: settings.primaryColor 
                }}
              >
                <h2 className={`font-black uppercase tracking-tight mb-2 whitespace-nowrap ${getDocTypeLabel().length > 14 ? 'text-lg' : 'text-2xl'}`}>
                  {getDocTypeLabel()}
                </h2>
                <div className="space-y-1 text-[10px] font-bold opacity-90">
                  <p className="flex justify-between gap-4">
                    <span>{getDocNumberLabel()}</span>
                    <span>{document.documentNumber}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span>Date :</span>
                    <span>{document.date?.split('-').reverse().join('/')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emitter and Client Section */}
          <div className="grid grid-cols-2 gap-8 mb-6 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-slate-300 -translate-x-1/2" />
            
            {/* Emitter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-white p-1.5 rounded-full" style={{ backgroundColor: settings.primaryColor }}>
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: settings.primaryColor }}>Émetteur</h3>
              </div>
              
              <div className="pl-6 space-y-1 text-[10px] font-bold text-slate-700">
                <p className="text-xs font-black text-slate-900">{settings.companyName || "REDA QOUNA"}</p>
                <p>{settings.address || "Centre Ain Dorrij Lamjaara Province OUEZZANE"}</p>
                {settings.cnss && <p>CNSS : {settings.cnss}</p>}
                {settings.patente && <p>Patente N : {settings.patente}</p>}
                {settings.rc && <p>R.C : {settings.rc}</p>}
                {settings.ifNum && <p>I.F : {settings.ifNum}</p>}
                {settings.ice && <p>ICE : {settings.ice}</p>}
                {settings.codeClient && <p>Code Client : {settings.codeClient}</p>}
                {settings.rib && <p className="pt-1 border-t border-slate-100 mt-1">RIB : {settings.rib}</p>}
              </div>
            </div>

            {/* Client */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-white p-1.5 rounded-full" style={{ backgroundColor: settings.primaryColor }}>
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: settings.primaryColor }}>Client</h3>
              </div>

              <div className="pl-6">
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                      DOIT (CLIENT) :
                    </span>
                    <p className="text-xs font-black text-slate-900 uppercase leading-tight">
                      {document.partnerName}
                    </p>
                  </div>

                  {document.partnerAddress && (
                    <p className="text-[9.5px] font-medium text-slate-600 leading-tight">
                      {document.partnerAddress}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[9.5px]">
                    {displayIce && displayIce.trim() && (
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <span className="text-slate-400 font-semibold">ICE Client :</span>
                        <span className="font-mono text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px]">{displayIce}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <span className="text-slate-400 font-semibold">Mode de Règlement :</span>
                      <span className="font-black uppercase text-indigo-950 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[9px]">
                        {paymentLabelMap[document.paymentMethod] || document.paymentMethod}
                      </span>
                    </div>

                    {(document.partnerPhone || document.partnerEmail) && (
                      <div className="flex flex-wrap gap-2 text-[9px] font-medium text-slate-500 pt-1">
                        {document.partnerPhone && <span>Tél: {document.partnerPhone}</span>}
                        {document.partnerEmail && <span>Email: {document.partnerEmail}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: settings.primaryColor }}>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-white font-black uppercase tracking-wider" style={{ backgroundColor: settings.primaryColor }}>
                    <th className="py-2 px-4 text-left border-r border-white/10">Quantité</th>
                    <th className="py-2 px-4 text-left border-r border-white/10">Désignation</th>
                    <th className="py-2 px-4 text-right border-r border-white/10">Prix Unité</th>
                    <th className="py-2 px-4 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {document.items?.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2.5 px-4 font-bold border-r border-slate-100">{item.qty.toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-black text-slate-900 border-r border-slate-100 uppercase">{item.productName}</td>
                      <td className="py-2.5 px-4 text-right font-bold border-r border-slate-100">{item.price.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">{(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Padding rows to fill space */}
                  {Array.from({ length: Math.max(0, 10 - (document.items?.length || 0)) }).map((_, i) => (
                    <tr key={`pad-${i}`} className="h-8 border-b border-slate-50">
                      <td className="border-r border-slate-100" />
                      <td className="border-r border-slate-100" />
                      <td className="border-r border-slate-100" />
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-12 gap-6 mt-6 items-start">
            <div className="col-span-7 space-y-4">
              <div className="border rounded-xl p-4 min-h-[60px]" style={{ borderColor: settings.primaryColor }}>
                <p className="text-[10px] font-black uppercase mb-1" style={{ color: settings.primaryColor }}>{getAmountInWordsPhrase()}</p>
                <p className="text-[12px] font-bold text-slate-700 italic leading-relaxed">
                  {numberToWordsFR(document.amountTTC)}.
                </p>
              </div>

              {/* Signature Box */}
              <div className="border border-slate-300 rounded-xl p-3 w-56 min-h-[95px] flex flex-col justify-between bg-white relative overflow-hidden">
                <p className="text-[9px] font-black uppercase text-center text-slate-400 border-b border-slate-100 pb-1 mb-1">Visa et Cachet</p>
                <div className="flex-1 flex items-center justify-center py-1">
                  {settings.stampUrl && (settings.stampUrl.startsWith('data:image/') || settings.stampUrl.startsWith('http') || settings.stampUrl.length > 20) ? (
                    <img 
                      src={settings.stampUrl} 
                      alt="Visa et Cachet" 
                      className="max-h-20 max-w-full object-contain" 
                    />
                  ) : settings.showStamp && settings.stampText ? (
                    <div className={`p-2 border-2 border-dashed rounded-lg text-center font-black text-[10px] uppercase rotate-[-3deg] ${
                      settings.stampColor === 'red' ? 'border-rose-600 text-rose-600 bg-rose-50/50' : 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    }`}>
                      <p>{settings.stampText}</p>
                      <p className="text-[7px] font-mono opacity-80 mt-0.5">{settings.companyName || 'SIGNÉ & VALIDE'}</p>
                    </div>
                  ) : (
                    <div className="h-10 text-[8px] text-slate-300 font-serif italic flex items-center justify-center">
                      Signature & Tampon
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-5">
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="flex justify-between p-2 text-[10px] font-bold text-slate-600">
                  <span>T.H.T</span>
                  <span>{document.amountHT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 text-[10px] font-bold text-slate-600">
                  <span>T.V.A 10%</span>
                  <span>{document.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 text-xs font-black text-white" style={{ backgroundColor: settings.primaryColor }}>
                  <span>TOTAL</span>
                  <span>{document.amountTTC.toFixed(2)} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Contact Icons */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 mt-auto border border-slate-200 rounded-xl p-3 text-[9.5px] font-bold text-slate-700">
            <div className="flex items-center gap-2 shrink-0">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: settings.primaryColor }} />
              <span>{settings.phone || "Téléphone"}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px] sm:border-x border-slate-200/60 sm:px-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: settings.primaryColor }} />
              <span className="leading-snug">{settings.address || "Adresse"}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: settings.primaryColor }} />
              <span>{settings.email || "Email"}</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="text-white text-center py-2 mt-4 -mx-8 -mb-8" style={{ backgroundColor: settings.primaryColor }}>
            <p className="text-[11px] font-serif italic tracking-widest opacity-90">
              Merci pour votre confiance
            </p>
          </div>
        </div>
      </div>

      {/* PDF High-Quality Download Guide Modal */}
      {showPdfGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Téléchargement PDF Haute Fidélité</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Obtenez une qualité vectorielle parfaite</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPdfGuide(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs leading-normal">
              <p className="text-slate-600 font-medium">
                Pour garantir une mise en page impeccable, des textes ultra-nets et un alignement 100% fidèle, nous vous recommandons d'utiliser le moteur PDF natif de votre navigateur :
              </p>

              {/* Steps */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 space-y-3 font-medium text-slate-700">
                <div className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0 mt-0.5">1</span>
                  <p>Cliquez sur le bouton bleu <strong className="text-indigo-600 font-bold">"Continuer vers le PDF"</strong> ci-dessous.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0 mt-0.5">2</span>
                  <p>Dans la fenêtre d'impression, réglez la <strong className="text-slate-900 font-bold">Destination</strong> sur <strong className="text-emerald-600 font-bold">"Enregistrer au format PDF"</strong> (au lieu de votre imprimante).</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0 mt-0.5">3</span>
                  <p>Cliquez sur <strong className="text-slate-900 font-bold">Enregistrer</strong>. Votre PDF sera magnifique et parfaitement aligné.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[11px] text-amber-800 font-bold flex gap-2">
                <span className="text-base select-none">💡</span>
                <p>Cette méthode vectorielle est celle qui donne le meilleur résultat possible sur mobile comme sur ordinateur.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPdfGuide(false);
                  generateLegacyPDF();
                }}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-center"
              >
                Télécharger en qualité standard (Ancien)
              </button>
              
              <div className="flex gap-2 sm:ml-auto">
                <button
                  onClick={() => setShowPdfGuide(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowPdfGuide(false);
                    handlePrint();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Continuer vers le PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
