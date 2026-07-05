import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, Shield, UserX, UserCheck, 
  MapPin, Phone, Calendar, ClipboardList, Info, AlertTriangle, X 
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Attendant } from '../types';

interface AttendantsProps {
  store: ERPStoreType;
}

export default function Attendants({ store }: AttendantsProps) {
  const { attendants, addAttendant, updateAttendant, deleteAttendant, currentRole, shifts } = store;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [matricule, setMatricule] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered attendants
  const filteredAttendants = attendants.filter(att => {
    const fullName = `${att.firstName} ${att.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          att.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          att.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || att.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateForm = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setMatricule(`PM-${new Date().getFullYear()}-${String(attendants.length + 1).padStart(3, '0')}`);
    setHireDate(new Date().toISOString().split('T')[0]);
    setStatus('active');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (att: Attendant) => {
    setIsEditMode(true);
    setSelectedId(att.id);
    setFirstName(att.firstName);
    setLastName(att.lastName);
    setPhone(att.phone);
    setMatricule(att.matricule);
    setHireDate(att.hireDate);
    setStatus(att.status);
    setNotes(att.notes);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !matricule) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload = {
      firstName,
      lastName,
      phone,
      matricule,
      hireDate,
      status,
      notes
    };

    if (isEditMode && selectedId) {
      updateAttendant(selectedId, payload, 'Directeur ERP');
    } else {
      addAttendant(payload, 'Directeur ERP');
    }

    setIsFormOpen(false);
  };

  const handleToggleStatus = (att: Attendant) => {
    const nextStatus = att.status === 'active' ? 'inactive' : 'active';
    updateAttendant(att.id, { status: nextStatus }, 'Directeur ERP');
  };

  const handleDelete = (id: string) => {
    deleteAttendant(id, 'Directeur ERP');
    setDeleteConfirmId(null);
  };

  // Get active shifts count or last shifts for attendants
  const getAttendantStats = (attId: string) => {
    const attShifts = shifts.filter(s => s.attendantId === attId);
    const totalShiftsCount = attShifts.length;
    const completedShifts = attShifts.filter(s => s.status === 'completed');
    const totalLitersSold = completedShifts.reduce((sum, s) => sum + (s.totalLiters || 0), 0);
    const totalDiscrepancy = completedShifts.reduce((sum, s) => sum + (s.discrepancy || 0), 0);

    return {
      shiftsCount: totalShiftsCount,
      litersSold: Math.round(totalLitersSold),
      discrepancy: parseFloat(totalDiscrepancy.toFixed(2))
    };
  };

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager';

  return (
    <div className="space-y-6" id="attendants-view">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Gestion de l'Équipe & Pompistes</h1>
          <p className="text-sm text-slate-500">Gérez les accès, affectations, dossiers et historiques de vos employés de piste.</p>
        </div>
        {hasWriteAccess && (
          <button 
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Embaucher un Pompiste
          </button>
        )}
      </div>

      {/* Barre de recherche et de filtres */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, matricule ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Statut :</label>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Actifs
            </button>
            <button 
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === 'inactive' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Inactifs
            </button>
          </div>
        </div>
      </div>

      {/* Liste des pompistes sous forme de Grid de cartes haut de gamme */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAttendants.map((att) => {
          const stats = getAttendantStats(att.id);
          return (
            <div 
              key={att.id} 
              className={`bg-white rounded-xl border transition-all hover:shadow-md relative ${att.status === 'inactive' ? 'border-slate-200 bg-[#f8fafc80]' : 'border-slate-200 shadow-sm'}`}
            >
              {/* Badge Statut */}
              <div className="absolute top-4 right-4">
                <button
                  disabled={!hasWriteAccess}
                  onClick={() => handleToggleStatus(att)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    att.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                  }`}
                  title={hasWriteAccess ? "Cliquer pour changer le statut" : ""}
                >
                  {att.status === 'active' ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      Actif
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 text-slate-400" />
                      Inactif
                    </>
                  )}
                </button>
              </div>

              {/* Contenu principal */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full font-bold font-display text-base ${att.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    {att.firstName[0]}{att.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 font-display text-base">{att.firstName} {att.lastName}</h3>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-500 font-bold mt-0.5">
                      ID: {att.matricule}
                    </span>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-1.5 text-xs text-slate-500 border-y border-slate-100 py-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Téléphone: <strong className="text-slate-700">{att.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Embauche: <strong className="text-slate-700">{new Date(att.hireDate).toLocaleDateString('fr-FR')}</strong></span>
                  </div>
                </div>

                {/* Statistiques Shifts réels */}
                <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Shifts</span>
                    <span className="block font-bold text-slate-800 text-sm font-mono mt-0.5">{stats.shiftsCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Volume Vendu</span>
                    <span className="block font-bold text-slate-800 text-sm font-mono mt-0.5">{stats.litersSold} L</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Écart Cumulé</span>
                    <span className={`block font-bold text-sm font-mono mt-0.5 ${stats.discrepancy < 0 ? 'text-rose-600' : stats.discrepancy > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {stats.discrepancy === 0 ? '0' : `${stats.discrepancy > 0 ? '+' : ''}${stats.discrepancy}`} MAD
                    </span>
                  </div>
                </div>

                {/* Notes de dossier */}
                {att.notes && (
                  <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 italic border-l-2 border-indigo-500 leading-relaxed">
                    "{att.notes}"
                  </div>
                )}

                {/* Actions */}
                {hasWriteAccess && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleOpenEditForm(att)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"
                      title="Modifier les informations"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(att.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                      title="Supprimer le pompiste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredAttendants.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">Aucun pompiste trouvé</h3>
            <p className="text-xs text-slate-400 mt-1">Essayez de modifier vos filtres ou effectuez une nouvelle recherche.</p>
          </div>
        )}
      </div>

      {/* FORMULAIRE MODAL AJOUT / MODIFICATION */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{isEditMode ? 'Modifier le Pompiste' : 'Embaucher un nouveau Pompiste'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prénom <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Yassine"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="El Amrani"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">N° Téléphone <span className="text-rose-500">*</span></label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+212 6 61 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Matricule Interne <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="PM-2026-001"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date d'embauche</label>
                  <input 
                    type="date" 
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Statut initial</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Actif (Prêt à opérer)</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notes & Observations Métier</label>
                <textarea 
                  placeholder="Compétences particulières, antécédents, observations de la direction..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {isEditMode ? 'Sauvegarder les modifications' : 'Confirmer l\'embauche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG CONFI CONFIRMATION SUPPRESSION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4 animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-950">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Êtes-vous absolument sûr de vouloir retirer ce pompiste des effectifs de la station ? Cette action est irréversible et supprimera son profil.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
