import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Clock, Fuel, HelpCircle, 
  Settings as SettingsIcon, Sliders, Bell, FileText, 
  DollarSign, Menu, X, Landmark, User, ShieldCheck, RefreshCw, CheckSquare 
} from 'lucide-react';

import { useERPStore } from './store';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { ERPStorage } from './data';

// Import our beautiful sub-modules
import Dashboard from './components/Dashboard';
import Attendants from './components/Attendants';
import Shifts from './components/Shifts';
import Tanks from './components/Tanks';
import Assets from './components/Assets';
import Registry from './components/Registry';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import { Billing } from './components/Billing';

type ActiveModule = 
  | 'dashboard' 
  | 'attendants' 
  | 'shifts' 
  | 'tanks' 
  | 'assets' 
  | 'registry' 
  | 'reports' 
  | 'alerts' 
  | 'settings'
  | 'billing' | 'daily_closing';

function AppContent({ session }: { session: any }) {
  const store = useERPStore();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const arrayKeys = [
          'products', 'tanks', 'pumps', 'nozzles', 'attendants', 'shifts', 
          'sales', 'supplies', 'stock_corrections', 'audit_logs', 
          'alerts', 'users', 'suppliers', 'clients', 'purchase_invoices', 'sales_invoices'
        ];
        
        const fetchedData: any = {};
        
        await Promise.all(arrayKeys.map(async (k) => {
          const { data } = await supabase.from(`erp_${k}`).select('*').eq('user_id', session.user.id);
          if (data && data.length > 0) fetchedData[k] = data;
        }));
        
        const objectKeys = ['cash_registry', 'config'];
        await Promise.all(objectKeys.map(async (k) => {
          const { data } = await supabase.from(`erp_${k}`).select('*').eq('user_id', session.user.id).single();
          if (data) fetchedData[k] = data;
        }));

        store.loadInitialData(fetchedData);
      } catch (err) {
        console.error('Erreur de chargement', err);
      } finally {
        setDataLoaded(true);
      }
    };
    
    fetchData();
  }, [session.user.id]);

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-800 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-sm">Chargement sécurisé de vos données SaaS...</p>
        </div>
      </div>
    );
  }

  // Unread alerts count for badge in sidebar & header
  const unreadAlertsCount = store.alerts.filter(a => !a.isRead).length;

  // Sidebar navigation configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, badge: 0 },
    { id: 'attendants', label: 'Pompistes', icon: Users, badge: 0 },
    { id: 'shifts', label: 'Gestion des Shifts', icon: Clock, badge: 0 },
    { id: 'tanks', label: 'Cuves & Stock', icon: Fuel, badge: 0 },
    { id: 'assets', label: 'Installations & Prix', icon: Sliders, badge: 0 },
    { id: 'registry', label: 'Session de Caisse', icon: DollarSign, badge: 0 },
    { id: 'billing', label: 'Facturation & Achats', icon: Landmark, badge: 0 },
    { id: 'reports', label: 'Centre de Rapports', icon: FileText, badge: 0 },
    { id: 'alerts', label: 'Supervision & IoT', icon: Bell, badge: unreadAlertsCount },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon, badge: 0 }
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.switchRole(e.target.value as any);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-900">
      
      {/* 2. SIDEBAR NAVIGATION */}
      <aside 
        className={`bg-slate-900 text-slate-300 w-64 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 transform lg:transform-none lg:static transition-transform duration-200 ease-in-out z-40 shadow-xl lg:shadow-none border-r border-slate-800 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo block */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm shadow-[#3b82f633] overflow-hidden shrink-0">
                {store.config.logo && (store.config.logo.startsWith('data:') || store.config.logo.startsWith('http') || store.config.logo.length > 5) ? (
                  <img src={store.config.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  store.config.logo || '⛽'
                )}
              </div>
              <div>
                <span className="text-white font-extrabold text-base tracking-tight block leading-none">{store.config.name || 'FuelMaster Pro'}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5 font-bold">StationERP Pro</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Gestion Centrale
            </div>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id as ActiveModule);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick legal compliance footer & IoT Sync */}
        <div className="flex flex-col shrink-0">
          <div className="p-3.5 bg-[#02061766] border-t border-[#1e293bcc] text-[10px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#10b981e6]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conforme Loi anti-fraude TVA</span>
            </div>
            <p className="leading-normal">Registre certifié inaltérable.</p>
          </div>
          
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Système IoT Connecté</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between items-center">
              <span>Synchro: temps réel</span>
              <span className="text-[9px] px-1 bg-[#10b9811a] text-emerald-400 rounded border border-[#10b98133] font-mono font-bold">OK</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-[#0206178c] backdrop-blur-xs lg:hidden z-30"
        ></div>
      )}

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 1. TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo & Station Name */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm overflow-hidden shadow-xs shrink-0">
                {store.config.logo && (store.config.logo.startsWith('data:') || store.config.logo.startsWith('http') || store.config.logo.length > 5) ? (
                  <img src={store.config.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  store.config.logo || '⛽'
                )}
              </div>
              <span className="text-slate-900 font-extrabold text-sm tracking-tight">{store.config.name || 'FuelMaster Pro'}</span>
            </div>
            
            <div className="hidden sm:flex items-center bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 text-slate-400 gap-2 text-xs">
              <span>🔍</span>
              <span className="font-medium">Rechercher une transaction, cuve ou pompiste...</span>
            </div>
          </div>

          {/* Right header actions: Role switcher & profile info */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Active attendants count indicator */}
            <div className="relative px-3 py-1 border-r border-slate-200 text-right hidden md:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Pompistes actifs</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">
                {store.attendants.filter(a => a.status === 'active').length.toString().padStart(2, '0')} / {store.attendants.length.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Profile role simulator switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase hidden lg:inline">Profil Actif :</span>
              <select 
                value={store.currentRole}
                onChange={handleRoleChange}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
              >
                <option value="admin">Administrateur / Propriétaire</option>
                <option value="manager">Chef de Station (Manager)</option>
                <option value="cashier">Caissier Principal</option>
              </select>
            </div>

            {/* User Account Mock */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden xl:block text-right">
                <span className="text-xs font-bold block leading-none text-slate-800">{session?.user?.email?.split('@')[0] || 'Utilisateur'}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mt-0.5">Station</span>
              </div>
              <div 
                onClick={() => supabase.auth.signOut().then(() => { localStorage.clear(); })}
                className="w-10 h-10 bg-rose-100 rounded-full border border-rose-200 flex items-center justify-center font-bold text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer shadow-xs"
                title="Déconnexion"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </div>
            </div>
          </div>
        </header>

        {/* 3. CORE VIEWPORT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeModule === 'dashboard' && <Dashboard store={store} setView={(v) => setActiveModule(v as ActiveModule)} />}
            {activeModule === 'attendants' && <Attendants store={store} />}
            {activeModule === 'shifts' && <Shifts store={store} />}
            {activeModule === 'tanks' && <Tanks store={store} />}
            {activeModule === 'assets' && <Assets store={store} />}
            {activeModule === 'registry' && <Registry store={store} />}
            {activeModule === 'billing' && <Billing store={store} />}
            {activeModule === 'reports' && <Reports store={store} />}
            {activeModule === 'alerts' && <Alerts store={store} />}
            {activeModule === 'settings' && <Settings store={store} />}
          </div>
        </main>
      </div>
    </div>
  );
}


export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {

        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

    
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-800 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return <AppContent session={session} />;
}
