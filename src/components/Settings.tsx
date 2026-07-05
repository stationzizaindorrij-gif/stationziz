import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, RotateCcw, Building, Printer, 
  MapPin, Phone, ShieldCheck, Cpu, Check, HelpCircle, HardDriveDownload,
  Upload, Trash2
} from 'lucide-react';
import { ERPStoreType } from '../store';

interface SettingsProps {
  store: ERPStoreType;
}

export default function Settings({ store }: SettingsProps) {
  const { config, updateConfig, resetAllData, currentRole } = store;

  const [name, setName] = useState(config.name);
  const [logo, setLogo] = useState(config.logo);
  const [address, setAddress] = useState(config.address);
  const [phone, setPhone] = useState(config.phone);
  const [taxId, setTaxId] = useState(config.taxId);
  const [autoBackup, setAutoBackup] = useState(config.autoBackup);
  const [language, setLanguage] = useState(config.language);
  const [theme, setTheme] = useState(config.theme);
  const [printerIp, setPrinterIp] = useState(config.printerIp);
  const [iotConfigured, setIotConfigured] = useState(config.iotConfigured);

  const [saving, setSaving] = useState(false);

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
        iotConfigured
      }, 'Directeur ERP');
      setSaving(false);
      alert("Configuration de la station-service mise à jour avec succès.");
    }, 800);
  };

  const handleReset = () => {
    const confirmReset = window.confirm("ATTENTION: Vous êtes sur le point de réinitialiser l'intégralité de la base de données ERP aux valeurs par défaut d'usine (réinitialisation des cuves, des pompistes, des ventes et des shifts). Souhaitez-vous continuer ?");
    if (confirmReset) {
      resetAllData();
      alert("La base de données ERP a été réinitialisée avec succès.");
      window.location.reload();
    }
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
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setLogo(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors group relative ${!hasWriteAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      disabled={!hasWriteAccess}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setLogo(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      <p className="text-xs font-semibold text-slate-600">
                        <span className="text-indigo-600 group-hover:underline">Cliquez pour uploader le logo</span> ou glissez-déposez l'image ici
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Adresse Physique d'Exploitation</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  disabled={!hasWriteAccess}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Numéro de Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="tel" 
                    disabled={!hasWriteAccess}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Numéro d'Identification Fiscal (Siret / VAT)</label>
                <input 
                  type="text" 
                  disabled={!hasWriteAccess}
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
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
    </div>
  );
}
