import React, { useState } from 'react';
import { Download, Smartphone, Monitor, Share2, PlusSquare, CheckCircle, X, Sparkles, Laptop } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export function PWAInstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isInstallable, install, isIOS, isInstalled } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shadow-inner">
              <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Installer StationERP</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PWA Officielle
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">Application autonome pour PC, Mac, Android & iPhone</p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5">
          {installSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Installation réussie !</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                L'application est maintenant ajoutée sur votre écran d'accueil et accessible directement.
              </p>
            </div>
          ) : (
            <>
              {/* Native Prompt Ready */}
              {isInstallable && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-950">Prêt pour l'installation directe en 1 clic</p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Cliquez ci-dessous pour installer l'application sur votre appareil sans passer par un store.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Installer Maintenant
                  </button>
                </div>
              )}

              {/* Instructions tabs / platforms */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Comment installer selon votre appareil :
                </p>

                {/* PC / Chrome / Edge */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        Sur PC / Ordinateur (Chrome, Edge, Brave)
                      </p>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        Regardez en haut à droite dans la <span className="font-semibold text-indigo-600">barre d'adresse (URL)</span> du navigateur. Vous verrez une icône d'installation <strong className="inline-block px-1.5 py-0.2 bg-slate-200 rounded text-[10px]">🖥️ Installer</strong> ou <strong className="inline-block px-1.5 py-0.2 bg-slate-200 rounded text-[10px]">⊕</strong>. Cliquez dessus pour l'installer sur votre bureau !
                      </p>
                    </div>
                  </div>
                </div>

                {/* Android Phone */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        Sur Téléphone Android
                      </p>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        Dans Chrome, appuyez sur le menu <strong className="font-mono">⋮</strong> (les 3 points en haut à droite), puis choisissez <strong className="text-slate-900 font-semibold">"Installer l'application"</strong> ou <strong className="text-slate-900 font-semibold">"Ajouter à l'écran d'accueil"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* iPhone / iPad (iOS Safari) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        Sur iPhone / iPad (Safari)
                      </p>
                      <ol className="text-slate-600 text-[11px] mt-1 list-decimal list-inside space-y-0.5 leading-relaxed">
                        <li>Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3 h-3 inline mx-0.5 text-indigo-600" /> en bas de l'écran.</li>
                        <li>Faites défiler vers le bas et appuyez sur <strong>"Sur l'écran d'accueil"</strong> <PlusSquare className="w-3 h-3 inline mx-0.5 text-indigo-600" />.</li>
                        <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Plein écran sans barres web</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Accès rapide en 1 clic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Performances ultra-fluides</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cache et offline sécurisé</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Button rendered in the Sidebar (for Desktop & Mobile navigation)
 */
export function PWAInstallSidebarButton() {
  const { isInstallable, install, isInstalled } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode, show subtle status or hide
  if (isInstalled) {
    return (
      <div className="px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-emerald-400 flex items-center gap-2 mb-2">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold truncate">App installée</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full mb-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-between group transition-all"
        title="Installer l'application sur PC ou Téléphone"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Download className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
          <span className="truncate">Installer l'application</span>
        </div>
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
          App
        </span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

/**
 * Mobile floating banner / badge to prompt install on phones
 */
export function PWAMobileBanner() {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('station_pwa_banner_dismissed') === 'true';
    }
    return false;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('station_pwa_banner_dismissed', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <aside 
        aria-label="Installation de l'application"
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3 animate-slide-up print:hidden"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
            <img src="/pwa-192x192.png" alt="Logo" className="w-7 h-7 object-contain rounded-md" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Installer StationERP</p>
            <p className="text-[10px] text-slate-400 truncate">Ajoutez à l'écran d'accueil pour un accès rapide</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAction}
            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm transition-all"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Fermer la bannière d'installation"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

/**
 * Top Header Install Button for mobile and desktop
 */
export function PWAHeaderButton() {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
        title="Installer l'application sur cet appareil"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installer l'application</span>
        <span className="sm:hidden">Installer</span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
