import React, { useRef } from 'react';
import { RichDocument, DocumentSettings } from './BillingTypes';
import { numberToWordsFR } from '../lib/numberToWords';
import { 
  Printer, Download, Mail, X, Check, Edit3, Trash2, 
  ArrowLeft, CheckCircle2, ShieldCheck, MailQuestion, Send
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
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (newStatus: RichDocument['status']) => void;
}

export function BillingDocumentView({
  document,
  settings,
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${document.docType.toUpperCase()} - ${document.documentNumber}</title>
          <style>
            /* Reset all margins and clear default browser header/footer */
            @page {
              size: A4;
              margin: 0 !important;
            }
            @media print {
              @page {
                size: A4;
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
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                padding: 15mm 20mm 15mm 20mm !important;
                box-sizing: border-box !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                background-color: white !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
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
          <script>
            window.addEventListener('load', () => {
              // Wait for all style assets to load before opening print dialog
              const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
              let loadedCount = 0;
              
              const doPrint = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };

              if (links.length === 0) {
                doPrint();
              } else {
                links.forEach((link) => {
                  link.addEventListener('load', () => {
                    loadedCount++;
                    if (loadedCount === links.length) doPrint();
                  });
                  link.addEventListener('error', () => {
                    loadedCount++;
                    if (loadedCount === links.length) doPrint();
                  });
                });
                // Fallback timeout to ensure it prints anyway
                setTimeout(doPrint, 1500);
              }
            });
          </script>
        </body>
      </html>
    `);

    // Copy style sheets and style elements to preserve Tailwind styling and custom settings
    Array.from(window.document.querySelectorAll('link[rel="stylesheet"], style')).forEach((el) => {
      try {
        printWindow.document.head.appendChild(el.cloneNode(true));
      } catch (e) {
        console.warn("Failed to clone stylesheet", e);
      }
    });

    printWindow.document.close();
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
      case 'client_devis': return 'DEVIS PRO-FORMA';
      case 'client_facture': return 'FACTURE VENDEUR';
      case 'client_bl': return 'BON DE LIVRAISON';
      case 'supplier_devis_req': return 'DEMANDE DE DEVIS';
      case 'supplier_br': return 'BON DE RÉCEPTION';
      case 'supplier_facture': return 'FACTURE FOURNISSEUR';
      default: return 'DOCUMENT COMMERCIAL';
    }
  };

  const paymentLabelMap: Record<string, string> = {
    virement: 'Virement Bancaire',
    carte: 'Carte Bancaire (TPE)',
    cheque: 'Chèque',
    especes: 'Espèces (Cash)',
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
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>

          {/* Send Email simulation */}
          <button
            onClick={handleSendEmail}
            disabled={emailStatus !== 'idle'}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition-all disabled:opacity-50"
          >
            {emailStatus === 'idle' && (
              <>
                <Mail className="w-4 h-4" />
                Envoyer par Mail
              </>
            )}
            {emailStatus === 'sending' && (
              <>
                <Send className="w-4 h-4 animate-bounce" />
                Envoi en cours...
              </>
            )}
            {emailStatus === 'sent' && (
              <>
                <Check className="w-4 h-4" />
                Envoyé avec succès !
              </>
            )}
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
          className="bg-white p-6 md:p-12 w-full max-w-[800px] border border-slate-200 shadow-md flex flex-col justify-between aspect-[1/1.4] text-left leading-relaxed text-slate-800 relative overflow-hidden"
          style={{ fontFamily: settings.fontFamily }}
        >
          {/* Top Brand Accent Ribbon/Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: settings.primaryColor }} />

          <div className="pt-2">
            
            {/* Header Section */}
            <div className="grid grid-cols-2 gap-4 items-start border-b-2 pb-6" style={{ borderColor: settings.primaryColor }}>
              
              {/* Company Info & Logo */}
              <div className="space-y-2">
                <div className="flex flex-col items-start gap-2">
                  {settings.logoUrl && (settings.logoUrl.startsWith('data:image/') || settings.logoUrl.startsWith('http')) ? (
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      style={{ width: `${settings.logoSize || 100}px`, height: 'auto' }}
                      className="object-contain rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-3xl font-black">{settings.logoUrl}</div>
                  )}
                  <h2 className="text-lg font-black tracking-tight" style={{ color: settings.primaryColor }}>
                    {settings.companyName}
                  </h2>
                </div>
                <div className="text-[10px] text-slate-400 font-bold space-y-0.5">
                  <p>{settings.address}</p>
                  <p>Tél : {settings.phone} | Email : {settings.email}</p>
                </div>
              </div>

              {/* Document Metadata block */}
              <div className="flex flex-col items-end space-y-2">
                <h1 className="text-xl font-black tracking-wider uppercase text-right" style={{ color: settings.primaryColor }}>
                  {getDocTypeLabel()}
                </h1>
                <div className="w-[240px] bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-bold space-y-1.5 leading-normal">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">N° Document :</span>
                    <span className="font-mono font-black text-slate-800">{document.documentNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Date d'émission :</span>
                    <span className="text-slate-600">{document.date}</span>
                  </div>
                  {document.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Date d'échéance :</span>
                      <span className="text-slate-600">{document.dueDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Paiement :</span>
                    <span className="text-slate-600">{paymentLabelMap[document.paymentMethod] || document.paymentMethod}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bill To / Ship To Partner details */}
            <div className="grid grid-cols-2 gap-4 py-6 text-xs">
              <div className="space-y-1.5 leading-normal">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Émetteur légal</span>
                <div className="text-[10px] text-slate-500 font-bold space-y-1">
                  <div>
                    <span className="text-slate-400">I.C.E. : </span>
                    <span className="font-mono text-slate-700">{settings.ice}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <div>
                      <span className="text-slate-400">R.C. Cas.: </span>
                      <span className="font-mono text-slate-700">{settings.rc}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div>
                      <span className="text-slate-400">Patente : </span>
                      <span className="font-mono text-slate-700">{settings.patente}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <div>
                      <span className="text-slate-400">I.F. Num : </span>
                      <span className="font-mono text-slate-700">{settings.ifNum}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div>
                      <span className="text-slate-400">CNSS : </span>
                      <span className="font-mono text-slate-700">{settings.cnss}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Capital : </span>
                    <span className="text-slate-700">{settings.capital}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 border-l-4 p-4 rounded-2xl space-y-1 leading-normal" style={{ borderLeftColor: settings.primaryColor }}>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Destinataire / Tiers commercial</span>
                <p className="font-black text-slate-800 text-sm">{document.partnerName}</p>
                {/* Find client or supplier details if needed */}
                <div className="text-[10px] text-slate-500 font-bold space-y-0.5 pt-1">
                  <div>
                    <span className="text-slate-400">ID Tiers : </span>
                    <span className="font-mono text-slate-700">{document.partnerId}</span>
                  </div>
                  {/* Dynamic fallback for simulated client info */}
                  <p className="text-slate-500">Maroc | Facturation légale</p>
                </div>
              </div>
            </div>

            {/* Document Lines Table */}
            <div className="mt-2">
              <table className="w-full border-collapse leading-normal">
                <thead>
                  <tr style={{ backgroundColor: settings.primaryColor }}>
                    {settings.columnsOrder
                      .filter(colKey => settings.visibleColumns[colKey as keyof DocumentSettings['visibleColumns']])
                      .map(colKey => (
                        <th 
                          key={colKey}
                          className={`p-2.5 text-[10px] font-black uppercase tracking-wider align-middle leading-normal ${
                            ['qty', 'price', 'discount', 'vat', 'totalHT', 'totalTTC'].includes(colKey) ? 'text-right' : 'text-left'
                          }`}
                          style={{ color: '#ffffff' }}
                        >
                          {columnsHeaderMap[colKey] || colKey}
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {document.items && document.items.map((item, index) => {
                    const lineHTRaw = item.price * item.qty;
                    const discountAmt = lineHTRaw * ((item.discount || 0) / 100);
                    const totalHT = lineHTRaw - discountAmt;
                    const vatAmt = totalHT * ((item.vat || 0) / 100);
                    const totalTTC = totalHT + vatAmt;

                    return (
                      <tr key={item.id || index} className="text-[10px] hover:bg-slate-50/30">
                        {settings.columnsOrder
                          .filter(colKey => settings.visibleColumns[colKey as keyof DocumentSettings['visibleColumns']])
                          .map(colKey => {
                            if (colKey === 'code') {
                              return <td key={colKey} className="p-2.5 font-mono text-slate-400 align-middle leading-normal">{item.productId || 'SERV-NC'}</td>;
                            }
                            if (colKey === 'name') {
                              return <td key={colKey} className="p-2.5 font-black text-slate-800 align-middle leading-normal">{item.productName || 'Article'}</td>;
                            }
                            if (colKey === 'description') {
                              return <td key={colKey} className="p-2.5 text-slate-500 italic max-w-xs truncate align-middle leading-normal">{item.description || '-'}</td>;
                            }
                            if (colKey === 'qty') {
                              return <td key={colKey} className="p-2.5 text-right font-mono font-bold text-slate-700 align-middle leading-normal">{item.qty}</td>;
                            }
                            if (colKey === 'price') {
                              return <td key={colKey} className="p-2.5 text-right font-mono text-slate-600 align-middle leading-normal">{item.price.toFixed(2)}</td>;
                            }
                            if (colKey === 'discount') {
                              return <td key={colKey} className="p-2.5 text-right font-mono text-slate-500 align-middle leading-normal">{item.discount > 0 ? `${item.discount}%` : '-'}</td>;
                            }
                            if (colKey === 'vat') {
                              return <td key={colKey} className="p-2.5 text-right font-mono text-slate-500 align-middle leading-normal">{item.vat}%</td>;
                            }
                            if (colKey === 'totalHT') {
                              return <td key={colKey} className="p-2.5 text-right font-mono text-slate-700 align-middle leading-normal">{totalHT.toFixed(2)}</td>;
                            }
                            if (colKey === 'totalTTC') {
                              return <td key={colKey} className="p-2.5 text-right font-mono font-bold text-slate-900 align-middle leading-normal">{totalTTC.toFixed(2)}</td>;
                            }
                            return null;
                          })
                        }
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Totals & Words Section */}
            <div className="grid grid-cols-12 gap-4 py-6 items-start">
              
              {/* Left Column: Words translation */}
              <div className="col-span-7 bg-slate-50/50 border border-slate-100 border-l-4 p-3.5 rounded-xl space-y-2 leading-normal" style={{ borderLeftColor: settings.primaryColor }}>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Arrêt de la présente pièce commerciale</span>
                <p className="text-[10px] font-bold text-slate-600 leading-normal italic">
                  <span>Arrêté la présente facture à la somme de : </span><br />
                  <span className="text-slate-800 font-black not-italic">« {numberToWordsFR(document.amountTTC)} »</span>
                </p>

                {/* Mixed payment breakdown list if applied */}
                {document.paymentMethod === 'mixed' && document.mixedPayments && document.mixedPayments.length > 0 && (
                  <div className="border-t border-slate-200/60 pt-2 space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Échéancier de règlement mixte</span>
                    <div className="space-y-0.5 text-[9px] font-bold">
                      {document.mixedPayments.map((row, idx) => (
                        <div key={idx} className="flex justify-between text-slate-500">
                          <span className="capitalize">{row.method === 'especes' ? 'Espèces' : row.method} :</span>
                          <span className="font-mono text-slate-700">{row.amount.toFixed(2)} Dh {row.ref ? `(Réf: ${row.ref})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Totals Calculations */}
              <div className="col-span-5 text-xs font-bold text-slate-600 space-y-2.5 pl-4 leading-normal">
                <div className="flex justify-between items-center">
                  <span>Total Brut HT :</span>
                  <span className="font-mono text-slate-800">{document.amountHT.toFixed(2)} Dh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Montant de la TVA :</span>
                  <span className="font-mono text-slate-800">{document.vatAmount.toFixed(2)} Dh</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black text-slate-900 border border-slate-100 border-l-4 rounded-xl p-3 leading-none" style={{ borderLeftColor: settings.primaryColor, backgroundColor: getLightAccentColor(settings.primaryColor, 0.08) }}>
                  <span className="leading-none">Net à Payer (TTC) :</span>
                  <span className="font-mono text-sm leading-none" style={{ color: settings.primaryColor }}>{document.amountTTC.toFixed(2)} Dh</span>
                </div>
              </div>

            </div>

            {/* Signature, Stamp & Seal Section */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-dashed border-slate-200 items-center">
              
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Conditions Générales de Règlement</span>
                <p className="text-[8px] text-slate-400 leading-normal font-medium max-w-sm">
                  {document.terms || settings.termsAndConditions}
                </p>
              </div>

              {/* Stamp or Signature placeholder */}
              {(settings.showStamp || settings.showSignature) && (
                <div className="flex flex-col items-end justify-center min-h-[95px] pr-4 relative">
                  
                  {/* Custom stamp / Uploaded stamp image */}
                  {settings.showStamp && (
                    settings.stampUrl && (settings.stampUrl.startsWith('data:image/') || settings.stampUrl.startsWith('http')) ? (
                      <div className="rotate-[-3deg] z-10 select-none max-w-[180px] mb-1">
                        <img 
                          src={settings.stampUrl} 
                          alt="Cachet d'entreprise" 
                          className="max-h-20 max-w-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`border-2 border-dashed ${
                          settings.stampColor === 'blue' ? 'border-blue-500/80 text-blue-600/80' : 'border-red-500/80 text-red-600/80'
                        } text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg rotate-[-5deg] tracking-widest text-center shadow-xs inline-block max-w-[180px] z-10 select-none bg-white/75`}
                      >
                        <p className="border-b border-dashed pb-0.5 mb-0.5">{settings.companyName}</p>
                        <p className="text-[7px]">{settings.stampText}</p>
                        <p className="text-[6px] opacity-75 mt-0.5">Casablanca - MAROC</p>
                      </div>
                    )
                  )}

                  {/* Simulated handwritten signature */}
                  {settings.showSignature && (
                    <div className="absolute bottom-2 right-12 z-0 opacity-40 select-none">
                      <p className="font-cursive text-slate-600 text-lg tracking-wider italic font-bold">
                        {settings.companyName.split(' ')[0]}
                      </p>
                    </div>
                  )}

                  <span className="text-[7px] font-black text-slate-400 uppercase block tracking-wider mt-2 mr-6">Cachet et Signature autorisés</span>
                </div>
              )}

            </div>

          </div>

          {/* Document Footer */}
          <div className="text-[8px] text-slate-400 font-bold border-t pt-4 text-center">
            {settings.footerText || "Merci de votre confiance."}
            <p className="text-[7px] text-slate-300 font-medium mt-1">ERP - Pièce comptable éditée numériquement</p>
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
