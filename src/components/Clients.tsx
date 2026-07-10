import React, { useState } from 'react';
import { ERPStoreType } from '../store';
import { Plus, Search, Users, Mail, Phone, Building, Edit2, Trash2, X, Save, User, Check, Wallet, Calendar, PlusCircle, History } from 'lucide-react';
import { Client } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ClientsProps {
  store: ERPStoreType;
}

export default function Clients({ store }: ClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    ice: '',
    contact: '',
    notes: ''
  });


  
  const handleDeletePayment = (paymentId: string) => {
    if (!selectedClient) return;
    const updatedPayments = (selectedClient.payments || []).filter((p: any) => p.id !== paymentId);
    store.updateClient(selectedClient.id, { payments: updatedPayments }, "Utilisateur");
    setSelectedClient({ ...selectedClient, payments: updatedPayments });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const newPayment = {
      id: `pay_${Date.now()}`,
      amount,
      date: paymentDate,
      notes: paymentNotes
    };
    
    const updatedPayments = [...(selectedClient.payments || []), newPayment];
    store.updateClient(selectedClient.id, { payments: updatedPayments }, 'Utilisateur');
    
    // Update local selected client to reflect changes immediately
    setSelectedClient({ ...selectedClient, payments: updatedPayments });
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingClient) {
      store.updateClient(editingClient.id, formData, 'Admin');
    } else {
      store.addClient(formData as Omit<Client, 'id'>, 'Admin');
    }
    closeModal();
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      ice: '',
      contact: '',
      notes: ''
    });
  };

  const filteredClients = store.clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.ice || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ITEMS_PER_PAGE = 7;
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  
  // Safe current page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!clientToDelete}
        title="Supprimer le client"
        message="Êtes-vous sûr de vouloir supprimer ce client ?"
        onConfirm={() => {
          if (clientToDelete) {
            store.deleteClient(clientToDelete, 'Admin');
          }
        }}
        onCancel={() => setClientToDelete(null)}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600" />
            Clients
          </h2>
          <p className="text-slate-500 mt-1">Gestion de votre portefeuille de clients professionnels et particuliers.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: '', ice: '', contact: '', notes: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ICE, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

                <div className="p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedClients.map(client => {
              const clientBonsList = store.shifts
                .filter(s => s.status === 'completed' && s.nonCashPayments && s.nonCashPayments.bonClient)
                .flatMap(shift => shift.nonCashPayments!.bonClient.filter(b => b.clientName?.toLowerCase().trim() === client.name.toLowerCase().trim()));
              const totalBons = clientBonsList.reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
              const totalPayments = (client.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
              const balance = totalBons - totalPayments;
              
              return (
              <div key={client.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100/50">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-900 transition-colors">{client.name}</h3>
                      {client.address && <p className="text-sm text-slate-500 mt-1 line-clamp-1" title={client.address}>{client.address}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Solde (Bons)</div>
                    <div className={`font-black font-mono text-sm ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {balance.toFixed(2)} MAD
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {client.ice ? `ICE: ${client.ice}` : 'Client Particulier'}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Détails & Règlements"
                    >
                      <Wallet className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
          {paginatedClients.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              Aucun client trouvé.
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Affichage {startIndex + 1} à {Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} sur {filteredClients.length} clients
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-medium border rounded-md ${
                    page === safeCurrentPage
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

      </div>

      
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Situation de compte : {selectedClient.name}
              </h2>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const clientBonsList = store.shifts
                  .filter(s => s.status === 'completed' || s.status === 'ready_to_close')
                  .flatMap(shift => {
                    const bons = shift.nonCashPayments?.bonClient || [];
                    return bons
                      .filter(b => b.clientName?.toLowerCase().trim() === selectedClient.name.toLowerCase().trim())
                      .map(b => ({ ...b, shiftDate: shift.date, shiftName: shift.shiftName }));
                  });

                const totalBons = clientBonsList.reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
                const totalPayments = (selectedClient.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
                const balance = totalBons - totalPayments;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Bons (Crédit)</div>
                        <div className="text-2xl font-black text-slate-800">{totalBons.toFixed(2)} <span className="text-sm">MAD</span></div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <div className="text-emerald-600/80 text-xs font-bold uppercase mb-1">Total Réglé</div>
                        <div className="text-2xl font-black text-emerald-700">{totalPayments.toFixed(2)} <span className="text-sm">MAD</span></div>
                      </div>
                      <div className={`rounded-xl p-4 border ${balance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-xs font-bold uppercase mb-1 ${balance > 0 ? 'text-rose-600/80' : 'text-slate-500'}`}>Reste à payer</div>
                        <div className={`text-2xl font-black ${balance > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{Math.max(0, balance).toFixed(2)} <span className="text-sm">MAD</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                          <History className="w-4 h-4 text-slate-400" />
                          Historique des Bons
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="p-2 font-bold text-slate-600">Date Shift</th>
                                <th className="p-2 font-bold text-slate-600 text-right">Montant</th>
                                <th className="p-2 font-bold text-slate-600 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {clientBonsList.length > 0 ? clientBonsList.map((bon, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2 text-slate-600">
                                    {new Date(bon.shiftDate).toLocaleDateString('fr-FR')} - Shift {bon.shiftName}
                                  </td>
                                  <td className="p-2 font-mono font-bold text-slate-800 text-right">
                                    {parseFloat(bon.amount as any).toFixed(2)}
                                  </td>
                                </tr>
                              )) : (
                                <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">Aucun bon trouvé</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Wallet className="w-4 h-4 text-slate-400" />
                          Historique des Règlements
                        </h3>
                        
                        <form onSubmit={handleAddPayment} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                              <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Montant (MAD)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optionnel)</label>
                            <input
                              type="text"
                              value={paymentNotes}
                              onChange={e => setPaymentNotes(e.target.value)}
                              placeholder="Chèque N°, Espèces..."
                              className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="pt-1">
                            <button type="submit" className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded flex justify-center items-center gap-1 transition-colors">
                              <PlusCircle className="w-4 h-4" /> Ajouter Règlement
                            </button>
                          </div>
                        </form>

                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[160px] overflow-y-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="p-2 font-bold text-slate-600">Date</th>
                                <th className="p-2 font-bold text-slate-600 text-right">Montant</th>
                                <th className="p-2 font-bold text-slate-600 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(selectedClient.payments || []).length > 0 ? [...(selectedClient.payments || [])].reverse().map((pay: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2 text-slate-600">
                                    {new Date(pay.date).toLocaleDateString('fr-FR')}
                                    {pay.notes && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{pay.notes}</div>}
                                  </td>
                                  <td className="p-2 font-mono font-bold text-emerald-600 text-right">
                                    {parseFloat(pay.amount).toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      onClick={() => handleDeletePayment(pay.id)}
                                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              )) : (
                                <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">Aucun règlement</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Informations Générales</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom / Raison Sociale *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ICE / IF</label>
                    <input
                      type="text"
                      value={formData.ice}
                      onChange={e => setFormData({...formData, ice: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Personne à contacter</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Coordonnées</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Complète</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Informations Complémentaires</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes ou conditions spécifiques</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!formData.name}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
