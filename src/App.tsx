import React, { useState, useEffect } from 'react';
import { History, 
  BarChart2, LayoutDashboard, Users, Clock, Fuel, 
  Settings as SettingsIcon, Sliders, Bell, FileText, 
  Menu, X, Landmark, User, Package
} from 'lucide-react';
import { useERPStore } from './store';
import { supabase } from './lib/supabase';
import Login from './components/Login';

// Import our sub-modules
import Dashboard from './components/Dashboard';
import Attendants from './components/Attendants';
import Shifts from './components/Shifts';
import Tanks from './components/Tanks';
import Assets from './components/Assets';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import { Billing } from './components/Billing';
import { Shop } from './components/Shop';
import Analytics from './components/Analytics';
import Clients from './components/Clients';
import DailyClosing from './components/DailyClosing';

type ActiveModule = 
  | 'dashboard' | 'attendants' | 'shifts' | 'tanks' | 'assets' 
  | 'reports' | 'alerts' | 'settings' | 'billing' | 'daily_closing'  
  | 'analytics' | 'clients' | 'shop' | 'price_history';

function AppContent({ session }: { session: any }) {
  const store = useERPStore();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 18 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const arrayKeys = [
          'products', 'tanks', 'pumps', 'nozzles', 'attendants', 'shifts', 
          'sales', 'supplies', 'stock_corrections', 'audit_logs', 
          'alerts', 'users', 'suppliers', 'clients', 'purchase_invoices', 'sales_invoices',
          'rich_documents'
        ];
        
        const fetchedData: any = {};
        let loaded = 0;
        const total = arrayKeys.length + 2;
        setLoadProgress({ loaded, total });

        const runInChunks = async (keys: string[], fetcher: (k: string) => Promise<void>, chunkSize = 4) => {
          for (let i = 0; i < keys.length; i += chunkSize) {
            const chunk = keys.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (k) => {
              try { await fetcher(k); } catch(e) { console.error(e); }
              loaded++;
              setLoadProgress({ loaded, total });
            }));
          }
        };

        await runInChunks(arrayKeys, async (k) => {
          let allData = [];
          let from = 0;
          const step = 1000;
          let hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from(`erp_${k}`)
              .select('*')
              .eq('user_id', session.user.id)
              .order('id')
              .range(from, from + step - 1);
              
            if (error || !data || data.length === 0) {
              hasMore = false;
            } else {
              allData = [...allData, ...data];
              if (data.length < step) hasMore = false;
              from += step;
            }
          }
          if (allData.length > 0) fetchedData[k] = allData;
        }, 4);
        
        const objectKeys = ['cash_registry', 'config'];
        await runInChunks(objectKeys, async (k) => {
          const { data } = await supabase.from(`erp_${k}`).select('*').eq('user_id', session.user.id).limit(1);
          if (data && data.length > 0) fetchedData[k] = data[0];
        }, 2);

        const sanitizeNulls = (obj: any): any => {
          if (obj === null) return undefined;
          if (Array.isArray(obj)) return obj.map(sanitizeNulls);
          if (typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
              newObj[key] = sanitizeNulls(obj[key]);
            }
            return newObj;
          }
          return obj;
        };

        store.loadInitialData(sanitizeNulls(fetchedData));
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
        <div className="text-slate-800 flex flex-col items-center gap-6 max-w-sm w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-center w-full space-y-2">
            <h3 className="font-bold text-lg text-slate-800">Synchronisation</h3>
            <p className="text-xs text-slate-500 font-medium">Chargement sécurisé de vos données...</p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.max(5, (loadProgress.loaded / loadProgress.total) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
              {loadProgress.loaded} / {loadProgress.total} modules chargés
            </p>
          </div>
        </div>
      </div>
    );
  }

  const unreadAlertsCount = store.alerts.filter(a => !a.isRead).length;

  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, badge: 0 },
    { id: 'attendants', label: 'Pompistes', icon: Users, badge: 0 },
    { id: 'shifts', label: 'Gestion des Shifts', icon: Clock, badge: 0 },
    { id: 'tanks', label: 'Cuves & Stock', icon: Fuel, badge: 0 },
    { id: 'assets', label: 'Installations & Prix', icon: Sliders, badge: 0 },
    { id: 'shop', label: 'Boutique', icon: Package, badge: 0 },
    { id: 'clients', label: 'Clients', icon: Users, badge: 0 },
    { id: 'billing', label: 'Facturation & Documents', icon: Landmark, badge: 0 },
    { id: 'analytics', label: 'Analyse & Rentabilité', icon: BarChart2, badge: 0 },
    { id: 'alerts', label: 'Supervision & IoT', icon: Bell, badge: unreadAlertsCount },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon, badge: 0 }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar 
        items={navigationItems} 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        store={store}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible print:bg-white">
        <Header 
          activeModule={activeModule} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 print:p-0 print:overflow-visible print:bg-white">
          <div className="max-w-[1400px] mx-auto h-full">
            {activeModule === 'dashboard' && <Dashboard store={store} setView={setActiveModule} />}
            {activeModule === 'tanks' && <Tanks store={store} />}
            {activeModule === 'assets' && <Assets store={store} />}
            {activeModule === 'attendants' && <Attendants store={store} />}
            {activeModule === 'shifts' && <Shifts store={store} />}
            {activeModule === 'shop' && <Shop store={store} />}
            {activeModule === 'billing' && <Billing store={store} />}
            {activeModule === 'reports' && <Reports store={store} />}
            {activeModule === 'analytics' && <Analytics store={store} />}
            {activeModule === 'alerts' && <Alerts store={store} />}
            {activeModule === 'settings' && <Settings store={store} />}
            {activeModule === 'clients' && <Clients store={store} />}
            {activeModule === 'daily_closing' && <DailyClosing store={store} shiftId={""} onBack={() => setActiveModule("dashboard")} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
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

export default App;

function Sidebar({ items, activeModule, setActiveModule, isOpen, setIsOpen, store }: {
  items: any[];
  activeModule: string;
  setActiveModule: (m: string) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  store: any;
}) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`\n        print:hidden
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 text-slate-300 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 overflow-hidden">
              {(store.config.logo && (store.config.logo.startsWith('data:') || store.config.logo.startsWith('http') || store.config.logo.length > 5)) ? (
                <img src={store.config.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl">{store.config.logo || '⛽'}</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">{store.config.name}</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">ERP System</p>
            </div>
          </div>
          <button 
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                  ${activeModule === item.id 
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${activeModule === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`
                    px-2 py-0.5 text-xs font-bold rounded-full
                    ${activeModule === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-indigo-500/20 text-indigo-400'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{store.currentRole.toUpperCase()}</p>
                <p className="text-xs text-slate-400">Connecté</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition-colors flex items-center justify-center gap-2"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ activeModule, onMenuClick }: { activeModule: string; onMenuClick: () => void }) {
  const moduleNames: Record<string, string> = {
    dashboard: 'Tableau de Bord',
    attendants: 'Pompistes',
    shifts: 'Gestion des Shifts',
    tanks: 'Cuves & Stock',
    assets: 'Installations & Prix',
    shop: 'Boutique',
    clients: 'Clients',
    billing: 'Facturation & Documents',
    reports: 'Centre de Rapports',
    analytics: 'Analyse & Rentabilité',
    alerts: 'Supervision & IoT',
    settings: 'Paramètres',
    daily_closing: 'Clôture Journalière'
  };

return (
    <header className="md:hidden print:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            {moduleNames[activeModule] || 'Dashboard'}
          </h2>
        </div>
      </div>
    </header>
  );
}
