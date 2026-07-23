import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle2, DollarSign, Fuel, Package, Database, Settings, Users, User, Droplet, Wallet, 
  CreditCard, Receipt, FileText, ChevronRight, ChevronLeft, Calendar, 
  Clock, Lock, CheckCircle, AlertTriangle, Plus, Trash2, Printer, Check
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import { ERPStoreType } from '../store';
import { Shift, Product, Nozzle, Sale } from '../types';

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

interface DailyClosingProps {
  store: ERPStoreType;
  shiftId: string;
  onBack: () => void;
}

interface SimulatedSale {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface SimulatedService {
  id: string;
  name: string;
  total: number;
}

interface PaymentBreakdown {
  cash: number;
  card: number;
  check: number;
  voucher: number;
  transfer: number;
  other: number;
}

interface Expense {
  id: string;
  type: string;
  description: string;
  amount: number;
  method: string;
}

export default function DailyClosing({ store, shiftId, onBack }: DailyClosingProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const handlePrint = () => {
    const element = contentRef.current;
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
      margin: 10,
      filename: `Cloture-${activeShift?.date || 'Journaliere'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
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
  const [currentStep, setCurrentStep] = useState(1);
  const activeShift = store.shifts.find(s => s.id === shiftId) || store.shifts.find(s => s.status === 'active');

  // Simulated data state
  const [endCounters, setEndCounters] = useState<{ [nozzleId: string]: { mech: number; elec: number } }>({});
  const [productSales, setProductSales] = useState<SimulatedSale[]>([]);
  const [serviceSales, setServiceSales] = useState<SimulatedService[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Expenses form state
  const [expDate, setExpDate] = useState(activeShift?.date || (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
  const [expType, setExpType] = useState('Achat fourniture');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expMethod, setExpMethod] = useState('cash');

  // Real cash state
  const [realCashInput, setRealCashInput] = useState('');
  const [paymentsBreakdown, setPaymentsBreakdown] = useState<PaymentBreakdown>({ cash: 0, card: 0, check: 0, voucher: 0, transfer: 0, other: 0 });
  const [hasEditedPayments, setHasEditedPayments] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize simulated data when an active shift is found
  useEffect(() => {
    if (activeShift && Object.keys(endCounters).length === 0) {
      if (activeShift.endCounters) {
        setEndCounters(activeShift.endCounters);
      } else {
        const counters: { [nozzleId: string]: { mech: number; elec: number } } = {};
        activeShift.pumpIds.forEach(pumpId => {
          const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
          pumpNozzles.forEach(noz => {
            const start = activeShift.startCounters[noz.id] || { mech: noz.currentMechCounter, elec: noz.currentElecCounter };
            counters[noz.id] = { mech: start.mech, elec: start.elec };
          });
        });
        setEndCounters(counters);
      }

      setProductSales([
        { id: '1', name: 'Huile Moteur 5W40', qty: 3, price: 120, total: 360 },
        { id: '2', name: 'Lave-Glace 5L', qty: 5, price: 45, total: 225 }
      ]);
      setServiceSales([
        { id: '1', name: 'Lavage Complet', total: 450 }
      ]);
    }
  }, [activeShift, endCounters, store.nozzles]);

  // Derived values
  const fuelSalesDetails = useMemo(() => {
    if (!activeShift) return { details: [], totalFuelAmount: 0 };
    const details = [];
    let totalFuelAmount = 0;

    activeShift.pumpIds.forEach(pumpId => {
      const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
      pumpNozzles.forEach(noz => {
        const start = activeShift.startCounters[noz.id];
        const end = endCounters[noz.id];
        if (start && end) {
          const startElecNum = parseFloat(start.elec as any) || 0;
          const startMechNum = parseFloat(start.mech as any) || 0;
          const endElecNum = parseFloat(end.elec as any) || 0;
          const endMechNum = parseFloat(end.mech as any) || 0;
          const qty = endElecNum - startElecNum;
          const product = store.products.find(p => p.id === noz.productId);
          const price = product ? product.salePrice : 0;
          const total = qty * price;
          totalFuelAmount += total;
          
          details.push({
            nozzle: noz,
            start: startElecNum,
            end: endElecNum,
            qty,
            price,
            total,
            startElec: startElecNum,
            startMech: startMechNum,
            endElec: endElecNum,
            endMech: endMechNum,
            qtyElec: qty,
            qtyMech: endMechNum - startMechNum
          });
        }
      });
    });
    return { details, totalFuelAmount };
  }, [activeShift, endCounters, store.nozzles, store.products]);

  const totalProductSales = productSales.reduce((acc, curr) => acc + curr.total, 0);
  const totalServiceSales = serviceSales.reduce((acc, curr) => acc + curr.total, 0);
  const grandTotalSales = fuelSalesDetails.totalFuelAmount + totalProductSales + totalServiceSales;
  const totalNonCashPayments = paymentsBreakdown.card + paymentsBreakdown.check + paymentsBreakdown.voucher + paymentsBreakdown.transfer + paymentsBreakdown.other;

  useEffect(() => {
    if (!hasEditedPayments && grandTotalSales > 0) {
      const card = Math.floor(grandTotalSales * 0.4);
      const check = Math.floor(grandTotalSales * 0.1);
      const voucher = Math.floor(grandTotalSales * 0.15);
      const cash = grandTotalSales - card - check - voucher;
      setPaymentsBreakdown({ cash, card, check, voucher, transfer: 0, other: 0 });
    }
  }, [grandTotalSales, hasEditedPayments]);

  

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const cashExpenses = expenses.filter(e => e.method === 'cash').reduce((acc, curr) => acc + curr.amount, 0);

  const theoreticalCash = paymentsBreakdown.cash - cashExpenses;
  const realCash = parseFloat(realCashInput) || 0;
  const ecart = realCash - theoreticalCash;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setExpenses([...expenses, {
      id: `exp_${Date.now()}`,
      date: expDate || activeShift?.date || (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]),
      type: expType,
      description: expDesc,
      amount,
      method: expMethod
    }]);
    setExpDesc('');
    setExpAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  
  const draftKey = activeShift ? 'dailyClosingDraft_' + activeShift.id : '';

  useEffect(() => {
    if (draftKey) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.endCounters) setEndCounters(parsed.endCounters);
          if (parsed.productSales) setProductSales(parsed.productSales);
          if (parsed.serviceSales) setServiceSales(parsed.serviceSales);
          if (parsed.expenses) setExpenses(parsed.expenses);
          if (parsed.paymentsBreakdown) setPaymentsBreakdown(parsed.paymentsBreakdown);
          if (parsed.hasEditedPayments) setHasEditedPayments(parsed.hasEditedPayments);
          if (parsed.realCashInput) setRealCashInput(parsed.realCashInput);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      } else if (activeShift) {
        // Fallback: load draft values directly from activeShift in database
        if (activeShift.expenses && activeShift.expenses.length > 0) {
          setExpenses(activeShift.expenses);
        }
        if (activeShift.endCounters && Object.keys(activeShift.endCounters).length > 0) {
          setEndCounters(activeShift.endCounters);
        }
        if (activeShift.productsSold && activeShift.productsSold.length > 0) {
          setProductSales(activeShift.productsSold);
        }
        if (activeShift.servicesSold && activeShift.servicesSold.length > 0) {
          setServiceSales(activeShift.servicesSold);
        }
        if (activeShift.realCashReceived) {
          setRealCashInput(activeShift.realCashReceived.toString());
        }
        if (activeShift.nonCashPayments) {
          const ncp = activeShift.nonCashPayments;
          setPaymentsBreakdown({
            cash: ncp.espece?.reduce((sum, item) => sum + item.amount, 0) || 0,
            card: ncp.tpe?.reduce((sum, item) => sum + item.amount, 0) || 0,
            check: ncp.cheque?.reduce((sum, item) => sum + item.amount, 0) || 0,
            voucher: (ncp.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0) + (ncp.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0),
            transfer: ncp.virement?.reduce((sum, item) => sum + item.amount, 0) || 0,
            other: ncp.autre?.reduce((sum, item) => sum + item.amount, 0) || 0,
          });
          setHasEditedPayments(true);
        }
      }
    }
  }, [draftKey, activeShift?.id]);

  useEffect(() => {
    if (draftKey && Object.keys(endCounters).length > 0) { // Don't save empty init state
      const draft = {
        currentStep,
        endCounters,
        productSales,
        serviceSales,
        expenses,
        paymentsBreakdown,
        hasEditedPayments,
        realCashInput
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [draftKey, currentStep, endCounters, productSales, serviceSales, expenses, paymentsBreakdown, hasEditedPayments, realCashInput]);

  // Real-time Database Draft Sync (Debounced by 1s)
  useEffect(() => {
    if (!activeShift) return;

    const handler = setTimeout(() => {
      const formattedNonCash = {
        carteSntl: [],
        espece: [{ amount: paymentsBreakdown.cash }],
        bonCarburantsVivo: [],
        vignette: [{ amount: paymentsBreakdown.voucher }],
        bonClient: [{ amount: paymentsBreakdown.voucher }],
        tpe: [{ amount: paymentsBreakdown.card, terminal: 'TPE' }],
        cheque: [{ amount: paymentsBreakdown.check }],
        virement: [{ amount: paymentsBreakdown.transfer }],
        autre: [{ amount: paymentsBreakdown.other }]
      };

      const hasEndCountersChanged = JSON.stringify(endCounters) !== JSON.stringify(activeShift.endCounters || {});
      const hasProductsSoldChanged = JSON.stringify(productSales) !== JSON.stringify(activeShift.productsSold || []);
      const hasServicesSoldChanged = JSON.stringify(serviceSales) !== JSON.stringify(activeShift.servicesSold || []);
      const hasExpensesChanged = JSON.stringify(expenses) !== JSON.stringify(activeShift.expenses || []);
      const hasRealCashChanged = (parseFloat(realCashInput) || 0) !== (activeShift.realCashReceived || 0);
      const hasNonCashChanged = JSON.stringify(formattedNonCash) !== JSON.stringify(activeShift.nonCashPayments || {});

      if (
        hasEndCountersChanged ||
        hasProductsSoldChanged ||
        hasServicesSoldChanged ||
        hasExpensesChanged ||
        hasRealCashChanged ||
        hasNonCashChanged
      ) {
        store.updateShift(activeShift.id, {
          endCounters,
          productsSold: productSales,
          servicesSold: serviceSales,
          expenses,
          realCashReceived: parseFloat(realCashInput) || 0,
          nonCashPayments: formattedNonCash
        }, 'Directeur ERP');
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [
    activeShift?.id,
    endCounters,
    productSales,
    serviceSales,
    expenses,
    paymentsBreakdown,
    realCashInput
  ]);

  const handleCloseShift = () => {
    if (!activeShift) return;
    
    // Pass the edited totals to store so it overrides what was submitted
    
    const totalLiters = fuelSalesDetails.details.reduce((acc: number, curr: any) => acc + (curr.end - curr.start), 0);
    
    const formattedNonCash = {
      carteSntl: [],
      espece: [{ amount: paymentsBreakdown.cash }],
      bonCarburantsVivo: [],
      vignette: [{ amount: paymentsBreakdown.voucher }],
      bonClient: [{ amount: paymentsBreakdown.voucher }],
      tpe: [{ amount: paymentsBreakdown.card, terminal: 'TPE' }],
      cheque: [{ amount: paymentsBreakdown.check }],
      virement: [{ amount: paymentsBreakdown.transfer }],
      autre: [{ amount: paymentsBreakdown.other }]
    };

    store.finalizeShiftClosing(
      activeShift.id, realCash, theoreticalCash, `Clôture journalière automatisée. Écart: ${ecart} MAD. Dépenses: ${totalExpenses} MAD.`, 'Directeur ERP',
      {
        totalLiters,
        totalAmount: fuelSalesDetails.totalFuelAmount,
        endCounters,
        nonCashPayments: formattedNonCash,
        expenses,
        productsSold: productSales,
        servicesSold: serviceSales
      }
    );
    if (draftKey) localStorage.removeItem(draftKey);
    setIsCompleted(true);
  };


  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 font-display">Clôture Journalière Réussie</h2>
          <p className="text-slate-500 mt-2 text-lg">La journée a été clôturée et archivée avec succès.</p>
        </div>
        
        {/* HIDDEN PRINTABLE DIV - Off-screen rendering to allow html2pdf to capture layout and dimensions correctly */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
          <div id="daily-closing-print" ref={contentRef} className="p-8 bg-white text-slate-800 text-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Rapport de Clôture Journalière</h2>
                <p className="text-slate-500">Date: {activeShift ? new Date(activeShift.date).toLocaleDateString('fr-FR') : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Station ERP Pro</p>
                <p className="text-xs text-slate-500">Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* RELEVÉ DES INDEX & VOLUMES */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                  Relevé des Index & Volumes
                </h4>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Pistolet</th>
                        <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Prix Unitaire</th>
                        <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Début (Elec/Méc)</th>
                        <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Fin (Elec/Méc)</th>
                        <th className="px-3 py-2 font-medium text-right text-slate-900 whitespace-nowrap">Volume (Elec/Méc)</th>
                        <th className="px-3 py-2 font-medium text-right text-slate-900 whitespace-nowrap">Montant (DH)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fuelSalesDetails.details.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-bold text-slate-800">
                            {row.nozzle.name}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                            {row.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                            {row.startElec.toFixed(2)} / <span className="text-orange-500">{row.startMech.toFixed(0)}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                            {row.endElec.toFixed(2)} / <span className="text-orange-500">{row.endMech.toFixed(0)}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="text-blue-700">{row.qtyElec.toFixed(2)}</span> / <span className="text-orange-600">{row.qtyMech.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <thead className="bg-slate-100 border-y border-slate-200 text-slate-600">
                      <tr>
                        <th colSpan={4} className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                          <div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Volumes par Carburant</div>
                        </th>
                        <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Volume (L)</th>
                        <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Montant (DH)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-slate-50/50">
                      {(() => {
                        const productAggregates = {};
                        fuelSalesDetails.details.forEach(d => {
                          if (d.qtyElec > 0) {
                            const prodName = d.nozzle.productName || 'Carburant Inconnu';
                            if (!productAggregates[prodName]) productAggregates[prodName] = { name: prodName, liters: 0, amount: 0 };
                            productAggregates[prodName].liters += d.qtyElec;
                            productAggregates[prodName].amount += d.total;
                          }
                        });
                        return Object.values(productAggregates).map((prod: any, idx) => (
                          <tr key={idx}>
                            <td colSpan={4} className="px-3 py-2 font-medium text-slate-800">
                              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100"><Droplet className="w-3.5 h-3.5 text-blue-500" /></div>{prod.name}</div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-700">{prod.liters.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{prod.amount.toFixed(2)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CUVES */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  État des Cuves
                </h4>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Cuve</th>
                        <th className="px-3 py-2 font-medium">Produit</th>
                        <th className="px-3 py-2 font-medium text-right">Niveau Actuel (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const usedTanks = new Set<string>();
                        fuelSalesDetails.details.forEach(d => {
                          if (d.qtyElec > 0) usedTanks.add(d.nozzle.tankId);
                        });
                        return Array.from(usedTanks).map(tankId => {
                          const tank = store.tanks.find(t => t.id === tankId);
                          if (!tank) return null;
                          return (
                            <tr key={tank.id}>
                              <td className="px-3 py-2 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                    <Database className="w-3 h-3 text-slate-500" />
                                  </div>
                                  {tank.number}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Droplet className="w-3 h-3 text-slate-400" />
                                  {tank.productName}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold">{tank.currentLevel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BILAN FINANCIER */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  Bilan Financier
                </h4>
                {/* DETAILS BOUTIQUE */}
                {productSales.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-500" />
                      Détails de Boutique
                    </h4>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-100">
                          {productSales.map((p: any) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{p.name}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.total.toFixed(2)} DH</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Boutique</td>
                            <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{totalProductSales.toFixed(2)} DH</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DETAILS LAVAGE LA GRAISSE */}
                {serviceSales.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-indigo-500" />
                      Détails de Lavage et Graissage
                    </h4>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-100">
                          {serviceSales.map((s: any) => (
                            <tr key={s.id}>
                              <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{s.name}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{s.total.toFixed(2)} DH</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Lavage et Graissage</td>
                            <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{totalServiceSales.toFixed(2)} DH</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  Bilan Financier
                </h4>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                      <div className="font-mono font-bold text-indigo-600 text-lg">+{((totalNonCashPayments + paymentsBreakdown.cash) + totalExpenses).toFixed(2)} DH</div>
                    </div>
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses / Manquant</div>
                      <div className={`font-mono font-bold text-lg ${(() => {
                        const totalEnc = (totalNonCashPayments + paymentsBreakdown.cash) + totalExpenses;
                        const diff = grandTotalSales - totalEnc;
                        return diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-rose-600' : 'text-slate-600';
                      })()}`}>
                        {(() => {
                          const totalEnc = (totalNonCashPayments + paymentsBreakdown.cash) + totalExpenses;
                          const diff = grandTotalSales - totalEnc;
                          if (diff > 0) return `-${diff.toFixed(2)} DH`;
                          if (diff < 0) return `+${Math.abs(diff).toFixed(2)} DH`;
                          return `0.00 DH`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                    <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Global</div>
                    <div className="font-mono font-black text-white text-2xl">{grandTotalSales.toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={handlePrint} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <Printer className="w-5 h-5" /> Imprimer le Rapport PDF
          </button>
          <button onClick={() => { setIsCompleted(false); setCurrentStep(1); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 flex items-center gap-2">
            Retour au Tableau de Bord
          </button>
        </div>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Aucun shift prêt à clôturer</h2>
        <p className="text-slate-500">Il n'y a pas de shift en attente de clôture pour le moment. Les pompistes doivent d'abord enregistrer leurs index de fin.</p>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Shift', icon: Clock },
    { id: 2, title: 'Carburants', icon: Fuel },
    { id: 3, title: 'Produits', icon: Package },
    { id: 4, title: 'Lavage et Graissage', icon: Settings },
    { id: 5, title: 'Paiements', icon: CreditCard },
    { id: 6, title: 'Dépenses', icon: Receipt },
    { id: 7, title: 'Résumé', icon: FileText }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">Clôture Journalière</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Automatisation du calcul de fin de journée - Shift {activeShift.shiftName}</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-indigo-100">
          <Lock className="w-4 h-4" /> Mode Auto-Récupération
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center gap-2 group relative z-10 w-20`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${currentStep === step.id ? 'bg-indigo-600 text-white shadow-md scale-110' : currentStep > step.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${currentStep === step.id ? 'text-indigo-700' : currentStep > step.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-1 bg-slate-100 mx-2 rounded-full overflow-hidden relative -mt-5">
                  <div className={`absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ${currentStep > step.id ? 'w-full' : 'w-0'}`}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-6 flex-1">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Informations du Shift</h3>
                  <p className="text-sm text-slate-500">Données automatiquement récupérées depuis le système.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pompiste</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    {activeShift.attendantName}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Date du shift</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(activeShift.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Heure d'ouverture</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {activeShift.startTime}
                  </div>
                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Durée du shift</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {(() => {
                      const [sh, sm] = activeShift.startTime.split(':').map(Number);
                      const now = new Date();
                      let diffMinutes = (now.getHours() * 60 + now.getMinutes()) - (sh * 60 + sm);
                      if (diffMinutes < 0) diffMinutes += 24 * 60;
                      const h = Math.floor(diffMinutes / 60);
                      const m = diffMinutes % 60;
                      return `${h}h ${m.toString().padStart(2, '0')}m`;
                    })()}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Heure actuelle</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {new Date().toTimeString().substring(0, 5)}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-4">Équipements affectés</h4>
                <div className="flex flex-wrap gap-3">
                  {activeShift.pumpIds.map(pid => {
                    const pump = store.pumps.find(p => p.id === pid);
                    const nozzles = store.nozzles.filter(n => n.pumpId === pid);
                    return pump && (
                      <div key={pid} className="bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm">
                        <span className="font-bold text-slate-700 block">{pump.number}</span>
                        <span className="text-xs text-slate-500">{nozzles.length} pistolets</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Ventes de Carburants</h3>
                  <p className="text-sm text-slate-500">Les index de fin ont été relevés automatiquement par les systèmes IoT.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="p-3">Pompe & Pistolet</th>
                      
                      <th className="p-3 text-right">Index Début (E/M)</th>
                      <th className="p-3 text-right">Index Fin (E/M)</th>
                      <th className="p-3 text-right whitespace-nowrap">Vol. Vendu (ELEC)</th>
                      <th className="p-3 text-right whitespace-nowrap">Vol. Vendu (MEC)</th>
                      <th className="p-3 text-right">Prix (MAD)</th>
                      <th className="p-3 text-right">Total (MAD)</th>
                        <th className="p-3 text-center w-20">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fuelSalesDetails.details.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">{row.nozzle.pumpNumber} - {row.nozzle.name}</td>
                        
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono text-slate-500 text-xs">E: {row.startElec.toFixed(3)}</span>
                            <span className="font-mono text-slate-500 text-xs">M: {row.startMech.toFixed(3)}</span>
                          </div>
                        </td>
                        <td className="p-3 bg-emerald-50/30 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-emerald-600/60 font-bold uppercase">E</span>
                              <input 
                                type="number" 
                                value={endCounters[row.nozzle.id]?.elec !== undefined ? endCounters[row.nozzle.id].elec : ''}
                                onChange={(e) => setEndCounters({...endCounters, [row.nozzle.id]: { ...endCounters[row.nozzle.id], elec: e.target.value }})}
                                className="w-20 text-right bg-transparent border-b border-emerald-200 focus:outline-none focus:border-emerald-500 font-bold font-mono text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-emerald-600/60 font-bold uppercase">M</span>
                              <input 
                                type="number" 
                                value={endCounters[row.nozzle.id]?.mech !== undefined ? endCounters[row.nozzle.id].mech : ''}
                                onChange={(e) => setEndCounters({...endCounters, [row.nozzle.id]: { ...endCounters[row.nozzle.id], mech: e.target.value }})}
                                className="w-20 text-right bg-transparent border-b border-emerald-200 focus:outline-none focus:border-emerald-500 font-bold font-mono text-xs"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-600 text-right whitespace-nowrap">{row.qtyElec.toFixed(3)} L</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">{row.qtyMech.toFixed(3)} L</td>
                        <td className="p-3 font-mono text-slate-500 text-right">{row.price.toFixed(2)}</td>
                        <td className="p-3 font-mono font-black text-slate-800 text-right">{row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={6} className="p-3 text-right text-slate-500 uppercase text-xs">Total ventes carburants</td>
                      <td className="p-3 font-mono text-lg text-emerald-600 text-right">{fuelSalesDetails.totalFuelAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Ventes de Produits (Boutique / Lubrifiants)</h3>
                  <p className="text-sm text-slate-500">Récupération automatique des ventes enregistrées dans le système TPE.</p>
                </div>
              </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-[2]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau Produit</label>
                    <input type="text" id="newProdName" placeholder="Ex: Additif Moteur" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qté</label>
                    <input type="number" id="newProdQty" defaultValue="1" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prix U.</label>
                    <input type="number" id="newProdPrice" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <button onClick={() => {
                    const name = (document.getElementById('newProdName') as HTMLInputElement).value;
                    const qty = parseFloat((document.getElementById('newProdQty') as HTMLInputElement).value) || 0;
                    const price = parseFloat((document.getElementById('newProdPrice') as HTMLInputElement).value) || 0;
                    if(name && qty && price) {
                      setProductSales([...productSales, { id: `prod_${Date.now()}`, name, qty, price, total: qty * price }]);
                      (document.getElementById('newProdName') as HTMLInputElement).value = '';
                      (document.getElementById('newProdQty') as HTMLInputElement).value = '1';
                      (document.getElementById('newProdPrice') as HTMLInputElement).value = '';
                    }
                  }} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-900 transition-colors h-[38px]">
                    Ajouter
                  </button>
                </div>
              </div>
              {productSales.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Produit</th>
                        <th className="p-3 text-right">Quantité</th>
                        <th className="p-3 text-right">Prix Unitaire (MAD)</th>
                        <th className="p-3 text-right">Total (MAD)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productSales.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-700">{item.name}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 text-right whitespace-nowrap">
                          <input type="number" value={item.qty} onChange={e => {
                            const qty = parseFloat(e.target.value) || 0;
                            setProductSales(productSales.map(p => p.id === item.id ? { ...p, qty, total: qty * p.price } : p));
                          }} className="w-16 text-right bg-transparent border-b border-indigo-200 focus:outline-none focus:border-indigo-500" />
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-right">
                          <input type="number" value={item.price} onChange={e => {
                            const price = parseFloat(e.target.value) || 0;
                            setProductSales(productSales.map(p => p.id === item.id ? { ...p, price, total: p.qty * price } : p));
                          }} className="w-20 text-right bg-transparent border-b border-slate-200 focus:outline-none focus:border-slate-500" />
                        </td>
                        <td className="p-3 font-mono font-black text-slate-800 text-right">
                          <input type="number" value={item.total} onChange={e => {
                            const total = parseFloat(e.target.value) || 0;
                            setServiceSales(serviceSales.map(s => s.id === item.id ? { ...s, total } : s));
                          }} className="w-24 text-right bg-transparent border-b border-cyan-200 focus:outline-none focus:border-cyan-500 font-bold" />
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setServiceSales(serviceSales.filter(s => s.id !== item.id))} className="text-rose-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setProductSales(productSales.filter(p => p.id !== item.id))} className="text-rose-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-slate-500 uppercase text-xs">Total ventes produits</td>
                        <td className="p-3 font-mono text-lg text-amber-600 text-right">{totalProductSales.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  Aucune vente de produit enregistrée pour ce shift.
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Lavage et Graissage</h3>
                  <p className="text-sm text-slate-500">Lavages et graisses comptabilisés sur la période du shift.</p>
                </div>
              </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-[2]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau Lavage et Graissage</label>
                    <input type="text" id="newServiceName" placeholder="Ex: Nettoyage" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Montant (MAD)</label>
                    <input type="number" id="newServiceAmount" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <button onClick={() => {
                    const name = (document.getElementById('newServiceName') as HTMLInputElement).value;
                    const amount = parseFloat((document.getElementById('newServiceAmount') as HTMLInputElement).value) || 0;
                    if(name && amount) {
                      setServiceSales([...serviceSales, { id: `srv_${Date.now()}`, name, total: amount }]);
                      (document.getElementById('newServiceName') as HTMLInputElement).value = '';
                      (document.getElementById('newServiceAmount') as HTMLInputElement).value = '';
                    }
                  }} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-900 transition-colors h-[38px]">
                    Ajouter
                  </button>
                </div>
              </div>
              {serviceSales.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Lavage et Graissage</th>
                        <th className="p-3 text-right">Total (MAD)</th>
                        <th className="p-3 text-center w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceSales.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-700">{item.name}</td>
                          <td className="p-3 font-mono font-black text-slate-800 text-right">
                          <input type="number" value={item.total} onChange={e => {
                            const total = parseFloat(e.target.value) || 0;
                            setServiceSales(serviceSales.map(s => s.id === item.id ? { ...s, total } : s));
                          }} className="w-24 text-right bg-transparent border-b border-cyan-200 focus:outline-none focus:border-cyan-500 font-bold" />
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setServiceSales(serviceSales.filter(s => s.id !== item.id))} className="text-rose-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="p-3 text-right text-slate-500 uppercase text-xs">Total ventes lavage et graissage</td>
                        <td className="p-3 font-mono text-lg text-cyan-600 text-right">{totalServiceSales.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  Aucun lavage/graisse enregistré pour ce shift.
                </div>
              )}
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Répartition des Paiements</h3>
                  <p className="text-sm text-slate-500">Regroupement automatique des modes de règlement.</p>
                </div>
              </div>

                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Ajuster la répartition (Total requis: {grandTotalSales} MAD)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries({ cash: 'Espèces', card: 'CB', check: 'Chèques', voucher: 'Bons Clients', transfer: 'Virements', other: 'Autres' }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                      <input 
                        type="number" 
                        value={(paymentsBreakdown as any)[key]} 
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setPaymentsBreakdown({ ...paymentsBreakdown, [key]: val });
                          setHasEditedPayments(true);
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Espèces</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{paymentsBreakdown.cash.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Carte Bancaire (TPE)</span>
                  <span className="text-2xl font-black text-blue-600 font-mono">{paymentsBreakdown.card.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Chèques</span>
                  <span className="text-2xl font-black text-slate-700 font-mono">{paymentsBreakdown.check.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Bons Clients (Vouchers)</span>
                  <span className="text-2xl font-black text-amber-600 font-mono">{paymentsBreakdown.voucher.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Virements</span>
                  <span className="text-2xl font-black text-indigo-600 font-mono">{paymentsBreakdown.transfer.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Autres</span>
                  <span className="text-2xl font-black text-slate-600 font-mono">{paymentsBreakdown.other.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Dépenses du Shift</h3>
                  <p className="text-sm text-slate-500">Enregistrez les sorties de caisse effectuées par le pompiste.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <form onSubmit={handleAddExpense} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-white" required />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type de dépense</label>
                    <select value={expType} onChange={e => setExpType(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-white">
                      <option>Achat fourniture</option>
                      <option>Aide / Manutention</option>
                      <option>Avance Pompiste</option>
                      <option>Frais Divers</option>
                    </select>
                  </div>
                  <div className="flex-[2] min-w-[180px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Ex: Achat eau pour station" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-white" required />
                  </div>
                  <div className="flex-1 min-w-[110px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Montant (MAD)</label>
                    <input type="number" step="any" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-white" required />
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Règlement</label>
                    <select value={expMethod} onChange={e => setExpMethod(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-white">
                      <option value="cash">Espèces (Caisse)</option>
                      <option value="card">Carte Bancaire</option>
                    </select>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-900 transition-colors h-[38px]">
                    Ajouter
                  </button>
                </form>
              </div>

              {expenses.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Règlement</th>
                        <th className="p-3 text-right">Montant (MAD)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs text-slate-600">{exp.date || expDate}</td>
                          <td className="p-3 font-bold text-slate-700">{exp.type}</td>
                          <td className="p-3 text-slate-600">{exp.description}</td>
                          <td className="p-3 text-slate-500">{exp.method === 'cash' ? 'Espèces' : 'Autre'}</td>
                          <td className="p-3 font-mono font-bold text-rose-600 text-right">-{exp.amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleRemoveExpense(exp.id)} className="text-rose-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-3 text-right text-slate-500 uppercase text-xs">Total dépenses</td>
                        <td className="p-3 font-mono text-lg text-rose-600 text-right">-{totalExpenses.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed mt-4">
                  Aucune dépense enregistrée pour ce shift.
                </div>
              )}
            </div>
          )}

          {/* STEP 7 */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Résumé Final & Clôture</h3>
                  <p className="text-sm text-slate-500">Vérifiez les totaux et renseignez la caisse réelle pour clôturer la journée.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Résumé section */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                    <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">Chiffre d'Affaires</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Ventes Carburants</span>
                      <span className="font-mono text-slate-800">{fuelSalesDetails.totalFuelAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Ventes Produits</span>
                      <span className="font-mono text-slate-800">{totalProductSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Ventes Lavage et Graissage</span>
                      <span className="font-mono text-slate-800">{totalServiceSales.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800">TOTAL CA</span>
                      <span className="font-mono font-black text-xl text-slate-900">{grandTotalSales.toFixed(2)} MAD</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                    <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">Flux Espèces (Caisse)</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2"><Plus className="w-3 h-3 text-emerald-500" /> Paiements Espèces</span>
                      <span className="font-mono text-emerald-600">+{paymentsBreakdown.cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2"><Trash2 className="w-3 h-3 text-rose-500" /> Dépenses Espèces</span>
                      <span className="font-mono text-rose-600">-{cashExpenses.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800">CAISSE THÉORIQUE</span>
                      <span className="font-mono font-black text-xl text-slate-900">{theoreticalCash.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* Validation section */}
                <div className="space-y-6">
                  <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-black text-indigo-900 text-lg mb-1">Caisse Réelle</h4>
                    <p className="text-xs text-indigo-600/70 mb-4">Combien d'espèces comptez-vous physiquement dans le tiroir-caisse ?</p>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-6 w-6 text-slate-400" />
                      </div>
                      <input 
                        type="number"
                        step="any"
                        value={realCashInput}
                        onChange={e => setRealCashInput(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black font-mono text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    {realCashInput && (
                      <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
                        Math.abs(ecart) === 0 ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' :
                        Math.abs(ecart) <= 50 ? 'bg-amber-50 border border-amber-100 text-amber-800' :
                        'bg-rose-50 border border-rose-100 text-rose-800'
                      }`}>
                        {Math.abs(ecart) === 0 ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${Math.abs(ecart) <= 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                        )}
                        <div>
                          <span className="font-bold block mb-1">Écart constaté : {ecart > 0 ? '+' : ''}{ecart.toFixed(2)} MAD</span>
                          <span className="text-xs opacity-80 leading-tight block">
                            {Math.abs(ecart) === 0 ? 'Caisse parfaite. Aucun écart détecté.' :
                             Math.abs(ecart) <= 50 ? 'Écart mineur. Peut être dû à de la petite monnaie.' :
                             'Écart important ! Veuillez recompter la caisse avant de clôturer.'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleCloseShift}
                    disabled={!realCashInput}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                  >
                    Clôturer la journée
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          
          <div className="flex gap-2">
            {steps.map(s => (
              <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${currentStep === s.id ? 'bg-indigo-600' : currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            ))}
          </div>

          <button 
            onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
            disabled={currentStep === 7}
            className={`px-6 py-2.5 font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all ${
              currentStep === 7 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent'
            }`}
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
