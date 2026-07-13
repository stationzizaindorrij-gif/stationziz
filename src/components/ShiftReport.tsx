import React from 'react';
import { Fuel, Droplet, Receipt, Package, Settings, Database, CreditCard, Banknote } from 'lucide-react';
import { Shift } from '../types';
import { ERPStoreType } from '../store';

interface ShiftReportProps {
  shift: Shift;
  store: ERPStoreType;
}

export default function ShiftReport({ shift, store }: ShiftReportProps) {
  const nonCashTotal = shift.nonCashPayments ? (
    (shift.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
    (shift.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
    (shift.nonCashPayments?.bonCarburantsVivo?.reduce((sum, item) => sum + item.amount, 0) || 0) +
    (shift.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0) +
    (shift.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0)
  ) : 0;

  const produitsTotal = shift.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
  const servicesTotal = shift.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
  const carburantsTotal = shift.totalAmount || 0;
  const chiffreAffaires = carburantsTotal + produitsTotal + servicesTotal;
  const depensesTotal = shift.expenses?.filter(e => e.method === 'cash').reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const especeARemettre = chiffreAffaires - nonCashTotal - depensesTotal;

  const usedTanks = new Set<string>();
  const nozzleRows: any[] = [];
  const productAggregates: Record<string, { name: string, liters: number, amount: number }> = {};

  if (shift.litersSold) {
    Object.entries(shift.litersSold).forEach(([nozzleId, liters]) => {
      if ((liters as number) > 0) {
        const nozzle = store.nozzles.find(n => n.id === nozzleId);
        if (nozzle) {
          usedTanks.add(nozzle.tankId);
          const product = store.products.find(p => p.id === nozzle.productId);
          const amount = shift.amountSold?.[nozzleId] || 0;
          const prodName = product?.name || nozzle.productName || 'Carburant Inconnu';
          
          nozzleRows.push({
            nozzleName: nozzle.name,
            productName: prodName,
            startElec: parseFloat(shift.startCounters?.[nozzleId]?.elec as any) || 0,
            startMech: parseFloat(shift.startCounters?.[nozzleId]?.mech as any) || 0,
            endElec: parseFloat(shift.endCounters?.[nozzleId]?.elec as any) || 0,
            endMech: parseFloat(shift.endCounters?.[nozzleId]?.mech as any) || 0,
            liters,
            amount
          });

          if (!productAggregates[prodName]) {
            productAggregates[prodName] = { name: prodName, liters: 0, amount: 0 };
          }
          productAggregates[prodName].liters += (liters as number);
          productAggregates[prodName].amount += (amount as number);
        }
      }
    });
  }

  // Same for expenses, boutique, non-cash etc.
  // I need to pull the full render from Shifts.tsx.
}
