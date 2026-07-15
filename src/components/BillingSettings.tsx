import React, { useState } from 'react';
import { DocumentSettings } from './BillingTypes';
import { 
  Check, Save, RefreshCw, Layout, Type, Palette, 
  Settings, Image, FileText, ArrowUp, ArrowDown, HelpCircle, ToggleLeft, ToggleRight,
  Upload, Trash2
} from 'lucide-react';
import { compressImage } from '../utils/image';

interface BillingSettingsProps {
  settings: DocumentSettings;
  onSave: (updated: DocumentSettings) => void;
}

export function BillingSettings({ settings, onSave }: BillingSettingsProps) {
  const [localSettings, setLocalSettings] = useState<DocumentSettings>({ ...settings });
  const [savedStatus, setSavedStatus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const [stampUploadError, setStampUploadError] = useState<string | null>(null);

  const colors = [
    { name: 'Indigo Stripe', hex: '#4f46e5' },
    { name: 'Noir Notion', hex: '#111827' },
    { name: 'Bleu Royal', hex: '#1d4ed8' },
    { name: 'Vert Forêt', hex: '#059669' },
    { name: 'Teal Émeraude', hex: '#0d9488' },
    { name: 'Ambre Épice', hex: '#d97706' },
    { name: 'Rose Rubis', hex: '#db2777' },
  ];

  const fonts = [
    { name: 'Inter (Moderne & Neutre)', value: 'Inter' },
    { name: 'Space Grotesk (Technologique)', value: 'Space Grotesk' },
    { name: 'Playfair Display (Élégant)', value: 'Playfair Display' },
    { name: 'Courier Prime (Classique/Rétro)', value: 'Courier Prime' },
  ];

  const handleFieldChange = (key: keyof DocumentSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNumberingChange = (docKey: keyof DocumentSettings['numbering'], field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      numbering: {
        ...prev.numbering,
        [docKey]: {
          ...prev.numbering[docKey],
          [field]: value
        }
      }
    }));
  };

  const handleColumnToggle = (columnKey: keyof DocumentSettings['visibleColumns']) => {
    setLocalSettings(prev => ({
      ...prev,
      visibleColumns: {
        ...prev.visibleColumns,
        [columnKey]: !prev.visibleColumns[columnKey]
      }
    }));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localSettings.columnsOrder];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
    }
    setLocalSettings(prev => ({ ...prev, columnsOrder: newOrder }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleLogoUpload = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError("Le fichier doit être une image (PNG, JPG, SVG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        compressImage(event.target.result as string, (compressed) => {
          handleFieldChange('logoUrl', compressed);
        });
      }
    };
    reader.onerror = () => {
      setUploadError("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  const handleStampDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStamp(true);
  };

  const handleStampDragLeave = () => {
    setIsDraggingStamp(false);
  };

  const handleStampDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStamp(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleStampUpload(file);
    }
  };

  const handleStampFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStampUpload(file);
    }
  };

  const handleStampUpload = (file: File) => {
    setStampUploadError(null);
    if (!file.type.startsWith('image/')) {
      setStampUploadError("Le fichier doit être une image (PNG, JPG, SVG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        compressImage(event.target.result as string, (compressed) => {
          handleFieldChange('stampUrl', compressed);
        }, 150, 150, 0.6); // Compress stamps slightly more
      }
    };
    reader.onerror = () => {
      setStampUploadError("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const presetLogos = [
    { label: '⛽ Pompe', value: '⛽' },
    { label: '⚡ Énergie', value: '⚡' },
    { label: '🌍 Globe', value: '🌍' },
    { label: '⭐ Étoile', value: '⭐' },
    { label: '🔥 Atlas', value: '🔥' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            Paramètres d'Édition des Documents
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Personnalisez entièrement l'apparence et le workflow de vos pièces commerciales</p>
        </div>
        <button
          type="submit"
          className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
        >
          {savedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          {savedStatus ? 'Modifications Enregistrées !' : 'Enregistrer tout'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne Gauche & Milieu : Formulaires */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1 : Informations de l'Entreprise */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layout className="w-4 h-4 text-slate-500" />
              1. Informations de l'Entreprise & Logo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom de l'Entreprise (Raison Sociale)</label>
                <input 
                  type="text" 
                  value={localSettings.companyName || ''}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                <input 
                  type="text" 
                  value={localSettings.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Adresse Email</label>
                <input 
                  type="email" 
                  value={localSettings.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Adresse Postale / Siège social</label>
                <textarea 
                  rows={2}
                  value={localSettings.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Logo Customization with File Upload */}
            <div className="bg-slate-50 p-5 rounded-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Logo du document</span>
                {localSettings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('logoUrl', '')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
              </div>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('logo-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative overflow-hidden ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50' 
                    : localSettings.logoUrl && (localSettings.logoUrl.startsWith('data:image/') || localSettings.logoUrl.startsWith('http'))
                      ? 'border-emerald-300 bg-emerald-50/10 hover:bg-emerald-50/20'
                      : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
                }`}
              >
                <input 
                  id="logo-file-input"
                  type="file" 
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {localSettings.logoUrl && (localSettings.logoUrl.startsWith('data:image/') || localSettings.logoUrl.startsWith('http')) ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="relative p-3 bg-white border border-slate-100 rounded-xl shadow-sm max-w-[200px] flex items-center justify-center">
                      <img 
                        src={localSettings.logoUrl} 
                        alt="Logo" 
                        className="max-h-20 max-w-full object-contain rounded-lg" 
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-emerald-700">Logo chargé avec succès</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Cliquez ou glissez un nouveau fichier pour remplacer</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">
                        <span className="text-indigo-600">Cliquez pour uploader le logo</span> ou glissez-déposez
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG ou WEBP (Max. 1.5 Mo)</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{uploadError}</p>
              )}

              {/* Logo Size Control */}
              {localSettings.logoUrl && (localSettings.logoUrl.startsWith('data:image/') || localSettings.logoUrl.startsWith('http')) && (
                <div className="pt-4 border-t border-slate-200/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-600 uppercase tracking-wide">Taille du Logo ({localSettings.logoSize || 100}px)</span>
                    <span className="font-mono text-slate-500 font-black">{localSettings.logoSize || 100} px</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-bold">Petit</span>
                    <input 
                      type="range" 
                      min="40" 
                      max="300" 
                      step="5"
                      value={localSettings.logoSize || 100}
                      onChange={(e) => handleFieldChange('logoSize', Number(e.target.value))}
                      className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">Grand</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 : Identifiants Légaux Marocains (ICE, RC, IF) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                2. Mentions Légales & Fiscales (Maroc)
              </h4>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Obligatoires pour facturation pro</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  I.C.E.
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Identifiant Commun de l'Entreprise (15 chiffres)" />
                </label>
                <input 
                  type="text" 
                  value={localSettings.ice || ''}
                  onChange={(e) => handleFieldChange('ice', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 001548..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Registre de Commerce (R.C.)</label>
                <input 
                  type="text" 
                  value={localSettings.rc || ''}
                  onChange={(e) => handleFieldChange('rc', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 45896"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Identifiant Fiscal (I.F.)</label>
                <input 
                  type="text" 
                  value={localSettings.ifNum || ''}
                  onChange={(e) => handleFieldChange('ifNum', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 1524896"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Numéro de Patente</label>
                <input 
                  type="text" 
                  value={localSettings.patente || ''}
                  onChange={(e) => handleFieldChange('patente', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 365214"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Affiliation C.N.S.S.</label>
                <input 
                  type="text" 
                  value={localSettings.cnss || ''}
                  onChange={(e) => handleFieldChange('cnss', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 8596541"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Capital Social</label>
                <input 
                  type="text" 
                  value={localSettings.capital || ''}
                  onChange={(e) => handleFieldChange('capital', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: 100 000 MAD"
                />
              </div>
            </div>
          </div>

          {/* Section 3 : Colonnes du Tableau */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layout className="w-4 h-4 text-slate-500" />
              3. Colonnes des Tableaux (Masquer, Afficher & Réorganiser)
            </h4>

            <p className="text-xs text-slate-500 font-medium">
              Cochez les colonnes à inclure dans vos documents imprimés. Utilisez les flèches pour changer l'ordre d'affichage de gauche à droite.
            </p>

            <div className="space-y-3">
              {localSettings.columnsOrder.map((colKey, index) => {
                const labelMap: Record<string, string> = {
                  code: 'Code / Réf Produit',
                  name: 'Désignation (Nom)',
                  description: 'Description détaillée',
                  qty: 'Quantité',
                  price: 'Prix Unitaire HT',
                  discount: 'Remise %',
                  vat: 'TVA %',
                  totalHT: 'Total HT',
                  totalTTC: 'Total TTC'
                };

                const isVisible = localSettings.visibleColumns[colKey as keyof DocumentSettings['visibleColumns']];

                return (
                  <div key={colKey} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleColumnToggle(colKey as keyof DocumentSettings['visibleColumns'])}
                        className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className={`text-sm font-bold ${isVisible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {labelMap[colKey] || colKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveColumn(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 transition-all ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(index, 'down')}
                        disabled={index === localSettings.columnsOrder.length - 1}
                        className={`p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 transition-all ${index === localSettings.columnsOrder.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4 : Numérotation & Séquences */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              4. Séquences de Numérotation (Indépendantes par workflow)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Numbers */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-2 uppercase">Côté Clients</h5>
                
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Devis Client (Ex: DEV-00001-2026)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_devis.prefix || ''} 
                        onChange={(e) => handleNumberingChange('client_devis', 'prefix', e.target.value)}
                        placeholder="Prefix" 
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.client_devis.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('client_devis', 'nextNumber', parseInt(e.target.value) || 1)}
                        placeholder="Suivant" 
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_devis.suffix || ''} 
                        onChange={(e) => handleNumberingChange('client_devis', 'suffix', e.target.value)}
                        placeholder="Suffix" 
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Facture Client (Ex: FAC-00001-2026)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_facture.prefix || ''} 
                        onChange={(e) => handleNumberingChange('client_facture', 'prefix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.client_facture.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('client_facture', 'nextNumber', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_facture.suffix || ''} 
                        onChange={(e) => handleNumberingChange('client_facture', 'suffix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Bon de Livraison Client (Ex: BLC-00001)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_bl.prefix || ''} 
                        onChange={(e) => handleNumberingChange('client_bl', 'prefix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.client_bl.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('client_bl', 'nextNumber', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.client_bl.suffix || ''} 
                        onChange={(e) => handleNumberingChange('client_bl', 'suffix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Numbers */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-slate-900 border-l-2 border-emerald-500 pl-2 uppercase">Côté Fournisseurs</h5>
                
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Demande de Devis (Ex: DEM-00001)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_devis_req.prefix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_devis_req', 'prefix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.supplier_devis_req.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('supplier_devis_req', 'nextNumber', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_devis_req.suffix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_devis_req', 'suffix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Bon de Réception (Ex: BRF-00001)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_br.prefix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_br', 'prefix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.supplier_br.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('supplier_br', 'nextNumber', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_br.suffix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_br', 'suffix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Facture Fournisseur (Ex: FAF-00001)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_facture.prefix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_facture', 'prefix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                      <input 
                        type="number" 
                        value={localSettings.numbering.supplier_facture.nextNumber || ''} 
                        onChange={(e) => handleNumberingChange('supplier_facture', 'nextNumber', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white font-mono" 
                      />
                      <input 
                        type="text" 
                        value={localSettings.numbering.supplier_facture.suffix || ''} 
                        onChange={(e) => handleNumberingChange('supplier_facture', 'suffix', e.target.value)}
                        className="border border-slate-200 rounded p-1.5 text-xs bg-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Design & Styles Généraux */}
        <div className="space-y-8">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Palette className="w-4 h-4 text-slate-500" />
              5. Design & Personnalisation Visuelle
            </h4>

            {/* Colors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Couleur Primaire</span>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleFieldChange('primaryColor', c.hex)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 hover:border-slate-300 bg-white shadow-xs transition-all"
                  >
                    <span className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                    <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="color" 
                  value={localSettings.primaryColor || ''}
                  onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 bg-transparent"
                />
                <input 
                  type="text" 
                  value={localSettings.primaryColor || ''}
                  onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                  className="border border-slate-200 rounded-lg p-1.5 text-xs w-28 text-center font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Font choice */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Typographie (Police de caractère)</span>
              <select
                value={localSettings.fontFamily || ''}
                onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none bg-white font-medium"
              >
                {fonts.map(f => (
                  <option key={f.value} value={f.value || ''}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Custom Stamp */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
              <span className="text-xs font-black text-slate-800 uppercase block tracking-wider">Cachet / Sceau & Signatures</span>
              
              {/* Toggle showStamp */}
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <span className="text-xs font-bold text-slate-600">Afficher le cachet d'entreprise</span>
                <button
                  type="button"
                  onClick={() => handleFieldChange('showStamp', !localSettings.showStamp)}
                  className="text-indigo-600"
                >
                  {localSettings.showStamp ? (
                    <ToggleRight className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {localSettings.showStamp && (
                <div className="space-y-4 animate-in fade-in duration-200 pt-1">
                  
                  {/* Stamp Upload Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase block">Uploader le cachet (Image)</label>
                      {localSettings.stampUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('stampUrl', '')}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Réinitialiser
                        </button>
                      )}
                    </div>

                    <div 
                      onDragOver={handleStampDragOver}
                      onDragLeave={handleStampDragLeave}
                      onDrop={handleStampDrop}
                      onClick={() => document.getElementById('stamp-file-input')?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative overflow-hidden bg-white ${
                        isDraggingStamp 
                          ? 'border-indigo-500 bg-indigo-50/50' 
                          : localSettings.stampUrl && (localSettings.stampUrl.startsWith('data:image/') || localSettings.stampUrl.startsWith('http'))
                            ? 'border-emerald-300 bg-emerald-50/5 hover:bg-emerald-50/10'
                            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                      }`}
                    >
                      <input 
                        id="stamp-file-input"
                        type="file" 
                        accept="image/*"
                        onChange={handleStampFileSelect}
                        className="hidden"
                      />

                      {localSettings.stampUrl && (localSettings.stampUrl.startsWith('data:image/') || localSettings.stampUrl.startsWith('http')) ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <img 
                            src={localSettings.stampUrl} 
                            alt="Cachet d'entreprise" 
                            className="max-h-16 max-w-full object-contain rounded" 
                          />
                          <p className="text-[9px] font-bold text-emerald-700">Cachet chargé avec succès</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-700">
                            <span className="text-indigo-600">Uploader une image du cachet</span> ou glisser-déposer
                          </p>
                          <p className="text-[8px] text-slate-400">PNG transparent recommandé (Max. 1.5 Mo)</p>
                        </div>
                      )}
                    </div>

                    {stampUploadError && (
                      <p className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 p-2 rounded-lg">{stampUploadError}</p>
                    )}
                  </div>

                  {/* Simulated Stamp Settings fallback if stampUrl is not uploaded */}
                  {!(localSettings.stampUrl && (localSettings.stampUrl.startsWith('data:image/') || localSettings.stampUrl.startsWith('http'))) && (
                    <div className="space-y-2 border-t border-slate-200/50 pt-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Ou configurer un cachet texte par défaut</span>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Texte du cachet</label>
                      <input 
                        type="text"
                        value={localSettings.stampText || ''}
                        onChange={(e) => handleFieldChange('stampText', e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs focus:outline-none"
                        placeholder="Ex: ATLAS PETROLEUM - VALIDÉ"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('stampColor', 'blue')}
                          className={`px-3 py-1 text-xs border rounded-lg ${localSettings.stampColor === 'blue' ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-white text-slate-500'}`}
                        >
                          Encre Bleue
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('stampColor', 'red')}
                          className={`px-3 py-1 text-xs border rounded-lg ${localSettings.stampColor === 'red' ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'bg-white text-slate-500'}`}
                        >
                          Encre Rouge
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer and Terms */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Pied de page par défaut</label>
                <input 
                  type="text" 
                  value={localSettings.footerText || ''}
                  onChange={(e) => handleFieldChange('footerText', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                  placeholder="Ex: Merci de votre confiance."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Conditions Générales (CGV / Devis)</label>
                <textarea 
                  rows={4}
                  value={localSettings.termsAndConditions || ''}
                  onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                  placeholder="Ex: Tout retard entraînera..."
                />
              </div>
            </div>
          </div>

          {/* Quick Preview Widget */}
          <div className="bg-[#111827] text-slate-100 p-6 rounded-2xl shadow-lg space-y-4 border border-slate-800">
            <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping mr-1" />
              Aperçu en Direct du Style
            </h5>

            <div className="bg-white text-slate-800 p-4 rounded-xl border border-slate-700 text-left space-y-3 shadow-inner" style={{ fontFamily: localSettings.fontFamily }}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-start gap-1.5">
                  {localSettings.logoUrl && (localSettings.logoUrl.startsWith('data:image/') || localSettings.logoUrl.startsWith('http')) ? (
                    <img 
                      src={localSettings.logoUrl} 
                      alt="Logo" 
                      style={{ width: `${(localSettings.logoSize || 100) * 0.35}px`, height: 'auto' }}
                      className="object-contain rounded" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-xl font-black">{localSettings.logoUrl}</div>
                  )}
                  <span className="text-xs font-black" style={{ color: localSettings.primaryColor }}>{localSettings.companyName || 'Mon Entreprise'}</span>
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase">FAC-00042</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[9px] text-slate-400">
                <span>ICE: {localSettings.ice || 'Non renseigné'}</span>
                <span></span>
              </div>
              
              {localSettings.showStamp && (
                <div className="flex justify-end pt-1">
                  {localSettings.stampUrl && (localSettings.stampUrl.startsWith('data:image/') || localSettings.stampUrl.startsWith('http')) ? (
                    <img 
                      src={localSettings.stampUrl} 
                      alt="Cachet d'entreprise" 
                      className="max-h-10 max-w-[100px] object-contain rotate-[-3deg]" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`border-2 border-dashed ${localSettings.stampColor === 'blue' ? 'border-blue-500 text-blue-500' : 'border-red-500 text-red-500'} text-[7px] font-black uppercase px-2 py-1 rounded-lg rotate-[-4deg] inline-block tracking-wider scale-95`}>
                      {localSettings.stampText || 'STAMP PREVIEW'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
