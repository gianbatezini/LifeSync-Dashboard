/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AuthError, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User,
  signOut 
} from 'firebase/auth';
import { 
  LayoutDashboard, 
  Wallet, 
  Dumbbell, 
  LogOut, 
  LogIn,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { auth } from './firebase';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import FinancialDashboard from './components/FinancialDashboard';
import FitnessDashboard from './components/FitnessDashboard';
import { ParticlesBackground } from './components/ParticlesBackground';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'finance' | 'fitness'>('finance');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-cyber-blue animate-pulse drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
          <p className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.2em]">Sincronizando LifeSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-[#e0e0e0]">
        <ParticlesBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-12"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-card-bg border border-cyber-blue shadow-[0_0_50px_rgba(0,240,255,0.2)] rounded-full flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-cyber-blue/5 animate-pulse" />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />
              <TrendingUp className="w-10 h-10 text-cyber-blue relative z-10 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="relative inline-block">
               <h1 className="text-7xl font-serif italic tracking-tighter">
                 <span className="bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent drop-shadow-[0_4px_10px_rgba(226,192,141,0.5)]">
                   CyberGenesis
                 </span>
               </h1>
               <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e2c08d]/50 to-transparent opacity-60" />
            </div>
            <p className="text-[#a68b5e] font-mono text-[10px] uppercase tracking-[0.5em] font-bold opacity-80 decoration-[#a68b5e]/20 underline underline-offset-8 decoration-1 leading-relaxed">
              Interface de Sincronização Neural // v1.0.8
            </p>
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-4 bg-card-bg border border-cyber-blue/30 py-6 px-8 rounded-sm shadow-[inset_0_0_20px_rgba(0,240,255,0.05)] hover:border-cyber-blue hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all group active:scale-[0.98] text-[#e0e0e0] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/50 to-transparent" />
            <LogIn className="w-5 h-5 text-gray-600 group-hover:text-cyber-blue transition-colors group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            <span className="font-mono font-bold tracking-[0.4em] uppercase text-[11px]">Inicializar Vínculo Neural</span>
          </button>
          
          <div className="pt-8 flex flex-col items-center gap-2">
            <div className="w-12 h-[1px] bg-border-dim"></div>
            <p className="text-[9px] text-gray-600 font-mono uppercase tracking-[0.3em]">
              Sistema de Integração Pessoal // v1.0.4
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-[#e0e0e0] font-sans selection:bg-gold/20 selection:text-gold">
      <ParticlesBackground />
      {/* Navigation Rail */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 bg-black/80 backdrop-blur-xl border-r border-border-dim flex flex-col items-center py-10 z-50">
        <div className="mb-16 relative">
          <div className="w-12 h-12 bg-card-bg border border-gold/40 rounded-sm flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-gold/5 blur-md group-hover:blur-lg transition-all" />
            <TrendingUp className="w-6 h-6 text-gold relative z-10 group-hover:scale-110 transition-transform" />
          </div>
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-gold shadow-[0_0_10px_rgba(226,192,141,1)]" />
        </div>

        <div className="flex-1 flex flex-col gap-10">
          <NavIcon 
            active={activeTab === 'finance'} 
            onClick={() => setActiveTab('finance')}
            icon={<Wallet className="w-5 h-5" />}
            label="Contabilidade"
          />
          <NavIcon 
            active={activeTab === 'fitness'} 
            onClick={() => setActiveTab('fitness')}
            icon={<Dumbbell className="w-5 h-5" />}
            label="Biometria"
          />
        </div>

        <button 
          onClick={logout}
          className="p-4 text-[#444] hover:text-red-500 transition-all mt-auto rounded-sm hover:bg-red-950/10 border border-transparent hover:border-red-500/20 shadow-none hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="pl-20 min-h-screen flex flex-col">
        <header className="px-12 pt-14 pb-10 flex items-end justify-between sticky top-0 bg-dark-bg/80 backdrop-blur-xl z-40 border-b border-white/5 mx-6">
          <div className="relative">
            <h2 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] mb-4 font-bold opacity-90 border-l-2 border-[#a68b5e]/30 pl-4">
              {activeTab === 'finance' ? 'Monitoramento de Liquidez de Ativos' : 'Métricas de Performance Orgânica'}
            </h2>
            <h1 className="text-6xl font-serif italic tracking-tighter flex items-baseline gap-5">
               <span className="bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                 {activeTab === 'finance' ? 'Finanças' : 'Bio-Métricas'}
               </span>
               <span className="text-[11px] font-mono text-[#e2c08d] uppercase tracking-[0.3em] font-medium opacity-40 italic border-b border-[#e2c08d]/20 pb-1">Classe-Genesis // Log</span>
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e0e0e0] mb-1 font-bold group">
                <span className="text-gold mr-2 opacity-50">//</span> {user.displayName}
              </p>
              <p className="text-[8px] text-cyber-blue font-mono uppercase tracking-widest opacity-60">ID Neural Verificado</p>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-cyber-blue/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={user.photoURL || ''} 
                alt={user.displayName || ''} 
                className="w-14 h-14 rounded-full border border-cyber-blue/30 bg-card-bg grayscale-0 hover:grayscale-0 transition-all p-1"
              />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-cyber-blue border-2 border-dark-bg rounded-full shadow-[0_0_10px_rgba(0,240,255,1)]"></div>
            </div>
          </div>
        </header>

        <div className="px-12 pb-12 pt-12 flex-1 relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] pointer-events-none rounded-full" />
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-blue/5 blur-[120px] pointer-events-none rounded-full" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'finance' ? <FinancialDashboard user={user} /> : <FitnessDashboard user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <footer className="px-16 py-10 border-t border-white/5 mx-6 flex justify-between items-center text-[8px] text-[#333] uppercase tracking-[0.4em] font-mono">
            <div className="flex gap-12">
              <span className="text-cyber-blue/40 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />
                 Núcleo: Online
              </span>
              <span className="hover:text-gold transition-colors cursor-help">Protocolo Seguro // AES-256</span>
              <span className="hover:text-cyber-blue transition-colors cursor-help">Disponibilidade: 99.998%</span>
            </div>
            <div className="opacity-50">© Interface de Controle CyberGenesis // Ver 1.0.8</div>
        </footer>
      </main>
    </div>
  );
}

function NavIcon({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 rounded-sm transition-all relative group flex items-center justify-center",
        active ? "bg-white/5 border border-cyber-blue shadow-[0_0_20px_rgba(0,240,255,0.1)] text-cyber-blue" : "text-[#444] hover:text-cyber-blue hover:scale-110 border border-transparent"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-cyber-blue/10 blur-xl opacity-0 transition-opacity",
        active && "opacity-100"
      )} />
      <div className="relative z-10">{icon}</div>
      {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-cyber-blue shadow-[0_0_15px_rgba(0,240,255,1)] rounded-full"></div>}
      <span className="absolute left-full ml-6 px-4 py-3 bg-black/90 backdrop-blur-md border border-cyber-blue/30 text-cyber-blue text-[10px] font-mono uppercase tracking-[0.3em] rounded-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50">
        {label}
      </span>
    </button>
  );
}

