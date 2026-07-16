import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const data = {
  tanks: [{ id: '1', name: 't', capacity: 10, currentLevel: 5, productType: 'x', lastRefill: 'x', status: 'x', fuel_type: 'x' }],
  pumps: [{ id: '1', name: 'p', status: 'active' }],
  nozzles: [{ id: '1', pumpId: '1', tankId: '1', name: 'n', type: 'x', currentCounter: 0, status: 'active' }],
  shifts: [{ id: '1', attendantId: '1', pumpIds: ['1'], startTime: 'x', endTime: 'x', startCounters: {}, endCounters: {}, totalSales: 0, nonCashPayments: [], cashCollected: 0, status: 'active', discrepancy: 0 }],
  sales: [{ id: '1', shiftId: '1', nozzleId: '1', type: 'x', volume: 0, amount: 0, timestamp: 'x', paymentMethod: 'x', customerId: 'x', attendantId: 'x' }],
  supplies: [{ id: '1', date: 'x', supplier: 'x', type: 'x', volume: 0, unitPrice: 0, totalAmount: 0, status: 'x', deliveryNote: 'x', driverName: 'x', truckPlate: 'x' }],
  stock_corrections: [{ id: '1', tankId: '1', type: 'x', volume: 0, reason: 'x', date: 'x', author: 'x' }],
  audit_logs: [{ id: '1', userId: '1', action: 'x', module: 'x', details: 'x', timestamp: 'x' }],
  alerts: [{ id: '1', type: 'x', message: 'x', severity: 'x', isRead: false, timestamp: 'x' }],
  users: [{ id: '1', name: 'x', email: 'x', role: 'x', status: 'x', lastLogin: 'x' }],
  suppliers: [{ id: '1', name: 'x', contact: 'x', email: 'x', phone: 'x', address: 'x', taxId: 'x', status: 'x' }],
  clients: [{ id: '1', name: 'x', contact: 'x', email: 'x', phone: 'x', address: 'x', taxId: 'x', status: 'x', balance: 0 }],
  purchase_invoices: [{ id: '1', number: 'x', date: 'x', supplierId: 'x', amount: 0, vat: 0, total: 0, status: 'x', dueDate: 'x' }],
  sales_invoices: [{ id: '1', number: 'x', date: 'x', clientId: 'x', amount: 0, vat: 0, total: 0, status: 'x', dueDate: 'x' }]
};

async function check() {
  for (const k of Object.keys(data)) {
    const obj = { ...data[k][0], user_id: '00000000-0000-0000-0000-000000000000' };
    const { error } = await supabase.from(`erp_${k}`).insert(obj);
    if (error && error.code === 'PGRST204') {
       console.log(`Table erp_${k} has missing columns! Error: ${error.message}`);
    }
  }
}
check();
