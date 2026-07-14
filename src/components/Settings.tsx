import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, RotateCcw, Building, Printer, 
  MapPin, Phone, ShieldCheck, Cpu, Check, HelpCircle, HardDriveDownload,
  Upload, Trash2, Loader2
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { ConfirmModal } from './ConfirmModal';
import { compressImage } from '../utils/image';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  store: ERPStoreType;
}

export default function Settings({ store }: SettingsProps) {
  const { config, updateConfig, resetAllData, currentRole } = store;
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [name, setName] = useState(config.name || '');
  const [logo, setLogo] = useState(config.logo || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [address, setAddress] = useState(config.address || '');

  const handleLogoUpload = async (file: File) => {
    if (!hasWriteAccess) return;
    try {
      setIsUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogo(data.publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert("Erreur lors du téléchargement du logo. Veuillez vérifier que le bucket 'logos' existe et est public.");
      // Fallback to base64 if bucket doesn't exist
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          compressImage(event.target.result as string, (compressed) => {
            setLogo(compressed);
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };
  const [phone, setPhone] = useState(config.phone || '');
  const [taxId, setTaxId] = useState(config.taxId || '');
  const [autoBackup, setAutoBackup] = useState(config.autoBackup ?? true);
  const [language, setLanguage] = useState(config.language || 'fr');
  const [theme, setTheme] = useState(config.theme || 'light');
  const [printerIp, setPrinterIp] = useState(config.printerIp || '');
  const [iotConfigured, setIotConfigured] = useState(config.iotConfigured ?? false);
  const [documentColor, setDocumentColor] = useState(config.documentColor || '#000000');
  const [documentCompanyDetails, setDocumentCompanyDetails] = useState(config.documentCompanyDetails || '');
  const [documentFooter, setDocumentFooter] = useState(config.documentFooter || '');
  const [documentNumbering, setDocumentNumbering] = useState(config.documentNumbering || {
    facture: { prefix: 'FACTURE N : ', nextNumber: 152025 },
    devis: { prefix: 'DEVIS N : ', nextNumber: 152025 },
    bonLivraison: { prefix: 'BL N : ', nextNumber: 152025 }
  });
  const [documentColumnsOrder, setDocumentColumnsOrder] = useState(config.documentColumnsOrder || ['quantity', 'designation', 'unitPrice', 'total']);

  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setName(config.name || '');
    setLogo(config.logo || '');
    setAddress(config.address || '');
    setPhone(config.phone || '');
    setTaxId(config.taxId || '');
    setAutoBackup(config.autoBackup ?? true);
    setLanguage(config.language || 'fr');
    setTheme(config.theme || 'light');
    setPrinterIp(config.printerIp || '');
    setIotConfigured(config.iotConfigured ?? false);
    setDocumentColor(config.documentColor || '#000000');
    setDocumentCompanyDetails(config.documentCompanyDetails || '');
    setDocumentFooter(config.documentFooter || '');
    if (config.documentNumbering) setDocumentNumbering(config.documentNumbering);
    if (config.documentColumnsOrder) setDocumentColumnsOrder(config.documentColumnsOrder);
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    setTimeout(() => {
      updateConfig({
        name,
        logo,
        address,
        phone,
        taxId,
        autoBackup,
        language,
        theme,
        printerIp,
        iotConfigured,
        documentColor,
        documentCompanyDetails,
        documentFooter,
        documentNumbering,
        documentColumnsOrder
      }, 'Directeur ERP');
      setSaving(false);
      alert("Configuration de la station-service mise à jour avec succès.");
    }, 800);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager';

  return (
    <div className="space-y-6" id="settings-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Paramètres du Système ERP</h1>
          <p className="text-sm text-slate-500">Configurez l'identité fiscale de votre entreprise, les périphériques réseau de piste et la sauvegarde automatique.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulaire de configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building className="w-4.5 h-4.5 text-indigo-500" />
            Informations de l'établissement
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Enseigne commerciale de la Station</label>
                <input 
                  type="text" 
                  disabled={!hasWriteAccess}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Logo de la Station-Service</label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                {/* Current Logo Preview */}
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-700 text-3xl overflow-hidden shrink-0 shadow-xs">
                  {logo && (logo.startsWith('data:') || logo.startsWith('http') || logo.length > 5) ? (
                    <img src={logo} alt="Station Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    logo || '⛽'
                  )}
                </div>
                
                {/* Upload Drop Zone / Button */}
                <div className="flex-1">
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!hasWriteAccess) return;
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        handleLogoUpload(file);
                      }
                    }}
                    className={`border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors group relative ${!hasWriteAccess || isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      disabled={!hasWriteAccess || isUploadingLogo}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleLogoUpload(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      {isUploadingLogo ? (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      )}
                      <p className="text-xs font-semibold text-slate-600">
                        <span className="text-indigo-600 group-hover:underline">{isUploadingLogo ? 'Téléchargement...' : 'Cliquez pour uploader le logo'}</span> {!isUploadingLogo && "ou glissez-déposez l'image ici"}
                      </p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, SVG ou WEBP (Max. 1MB)</p>
                    </div>
                  </div>
                </div>

                {/* Actions / Emoji Backup option */}
                <div className="flex flex-col gap-2 shrink-0">
                  <input 
                    type="text" 
                    disabled={!hasWriteAccess}
                    placeholder="Ou tapez un Emoji (ex: ⛽)"
                    value={logo && logo.length <= 5 ? logo : ''}
                    onChange={(e) => setLogo(e.target.value)}
                    className="border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 w-full text-center"
                  />
                  {logo && logo.length > 5 && (
                    <button
                      type="button"
                      disabled={!hasWriteAccess}
                      onClick={() => setLogo('⛽')}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 hover:text-rose-600 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Retirer l'image</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Périphériques de piste et automatisation */}
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 pt-4 flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-indigo-500" />
              Réseau de piste, IoT & Périphériques
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">IP de l'Imprimante de Ticket Thermique</label>
                <div className="relative">
                  <Printer className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    disabled={!hasWriteAccess}
                    placeholder="192.168.1.XXX"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Automate de Piste (IoT)</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    disabled={!hasWriteAccess}
                    checked={iotConfigured}
                    onChange={(e) => setIotConfigured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-600">Connexion Automatique IoT Pompes</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Langue d'Exploitation</label>
                <select 
                  value={language}
                  disabled={!hasWriteAccess}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="fr">Français (France)</option>
                  <option value="en">English (UK)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sauvegarde automatique</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    disabled={!hasWriteAccess}
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-600">Backup Cloud toutes les 12h</span>
                </label>
              </div>
            </div>

            {hasWriteAccess && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Sauvegarder les configurations'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Section de sécurité critique / Maintenance base de données */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider border-b border-rose-100 pb-2 flex items-center gap-2">
            <RotateCcw className="w-4.5 h-4.5 text-rose-500" />
            Zone de Maintenance & Sécurité
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour les démonstrations ou audits système, vous pouvez réinitialiser l'ensemble de la base de données ERP locale (localStorage) afin de retrouver les valeurs de test d'usine.
          </p>

          <button 
            onClick={handleReset}
            className="w-full px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser l'ERP aux données d'usine
          </button>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <h4 className="font-bold">Versions logicielles :</h4>
            <div className="flex justify-between font-mono text-[10px]">
              <span>StationERP Suite :</span>
              <span>v4.1.2-enterprise</span>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span>Contrôleur IoT d'index :</span>
              <span>Firmware v8.90</span>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span>Dernière sauvegarde :</span>
              <span>À l'instant</span>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-rose-600 mb-2">ATTENTION DANGER</h3>
              <p className="text-sm text-slate-500 mb-6">Vous êtes sur le point de réinitialiser l'intégralité de la base de données ERP aux valeurs par défaut d'usine (réinitialisation des cuves, des pompistes, des ventes et des shifts). Souhaitez-vous continuer ?</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    resetAllData();
                    setShowResetConfirm(false);
                    // Instead of alert, we just reload
                    window.location.reload();
                  }}
                  className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                >
                  Oui, Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

