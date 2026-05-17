import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Scale, 
  Zap, 
  Dumbbell, 
  Activity, 
  Plus, 
  History,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { db } from '../firebase';
import { PhysicalMetric, Exercise } from '../types';
import { handleFirestoreError, OperationType, cn, parseLocalDate } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { format } from 'date-fns';

export default function FitnessDashboard({ user }: { user: User }) {
  const [metrics, setMetrics] = useState<PhysicalMetric[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const [metricForm, setMetricForm] = useState({
    weight: '',
    bodyFat: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [exerciseForm, setExerciseForm] = useState({
    type: 'strength' as 'aerobic' | 'strength',
    name: '',
    value: '', // kg or km/min
    subValue: '', // reps or bpm
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const qM = query(collection(db, 'physicalMetrics'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(50));
    const qE = query(collection(db, 'exercises'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(50));

    const unsubM = onSnapshot(qM, snapshot => {
      setMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhysicalMetric)));
    });
    const unsubE = onSnapshot(qE, snapshot => {
      setExercises(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise)));
    });

    return () => { unsubM(); unsubE(); };
  }, [user.uid]);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'physicalMetrics'), {
        userId: user.uid,
        weight: parseFloat(metricForm.weight),
        bodyFat: metricForm.bodyFat ? parseFloat(metricForm.bodyFat) : null,
        date: metricForm.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddingMetric(false);
      setMetricForm({ weight: '', bodyFat: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'physicalMetrics');
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'exercises'), {
        userId: user.uid,
        type: exerciseForm.type,
        name: exerciseForm.name,
        value: parseFloat(exerciseForm.value),
        subValue: exerciseForm.subValue ? parseFloat(exerciseForm.subValue) : null,
        date: exerciseForm.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddingExercise(false);
      setExerciseForm({ type: 'strength', name: '', value: '', subValue: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'exercises');
    }
  };

  const weightData = metrics
    .slice()
    .reverse()
    .map(m => ({ 
      date: format(parseLocalDate(m.date), 'dd/MM'), 
      weight: m.weight 
    }));

  const latestWeight = metrics[0]?.weight;
  const prevWeight = metrics[1]?.weight;
  const weightDiff = latestWeight && prevWeight ? latestWeight - prevWeight : 0;

  return (
    <div className="space-y-12">
      {/* Overview Cards - Resilient Dark Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card-bg p-10 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden group hover:border-cyber-blue/40 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-blue/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-cyber-blue/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="p-4 bg-cyber-blue/5 border border-cyber-blue/20 rounded-sm text-cyber-blue shadow-[0_0_20px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all">
              <Scale className="w-6 h-6" />
            </div>
            {weightDiff !== 0 && (
              <div className={cn(
                "flex items-center gap-2 text-[10px] font-mono px-4 py-1.5 bg-black border border-white/10 rounded-full tracking-widest",
                weightDiff < 0 ? "text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]" : "text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]"
              )}>
                {weightDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {Math.abs(weightDiff).toFixed(1)} KG
              </div>
            )}
          </div>
          <div className="mt-10 relative z-10">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-3 font-bold">Índice de Massa Molecular</p>
            <h3 className="text-5xl font-light tracking-tighter text-white">
              {latestWeight ? latestWeight.toFixed(1) : '--'}
              <span className="text-xs font-serif italic text-cyber-blue ml-3 uppercase tracking-[0.2em] opacity-80 mix-blend-screen">kg</span>
            </h3>
          </div>
        </div>

        <div className="bg-card-bg p-10 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden group hover:border-gold/40 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors" />
          <div className="p-4 bg-gold/5 border border-gold/20 rounded-sm text-gold w-fit shadow-[0_0_20px_rgba(226,192,141,0.15)] group-hover:shadow-[0_0_30px_rgba(226,192,141,0.3)] transition-all">
            <Activity className="w-6 h-6" />
          </div>
          <div className="mt-10 relative z-10">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-3 font-bold">Concentração Lipídica</p>
            <h3 className="text-5xl font-light tracking-tighter text-white">
              {metrics[0]?.bodyFat ? metrics[0].bodyFat.toFixed(1) : '--'}
              <span className="text-xs font-serif italic text-gold ml-3 uppercase tracking-[0.2em] opacity-80">% BF</span>
            </h3>
          </div>
        </div>

        <div className="bg-card-bg p-10 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden group hover:border-cyber-blue/40 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-blue/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-cyber-blue/10 transition-colors" />
          <div className="p-4 bg-cyber-blue/5 border border-cyber-blue/20 rounded-sm text-cyber-blue w-fit shadow-[0_0_20px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all">
            <Zap className="w-6 h-6" />
          </div>
          <div className="mt-10 relative z-10">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-3 font-bold">Último Protocolo Ativo</p>
            <h3 className="text-2xl font-serif italic text-cyber-blue tracking-tighter truncate mt-3 pr-4 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              {exercises[0] ? exercises[0].name : 'Unidade em Espera'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Weight Progress Chart */}
        <div className="bg-card-bg p-12 rounded-sm border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyber-blue/5 to-transparent pointer-events-none" />
          <div className="flex items-end justify-between relative z-10">
            <div>
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f8e4be] shadow-[0_0_10px_rgba(248,228,190,0.8)]" />
                 <h3 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] font-bold">Deriva Biométrica</h3>
               </div>
              <h4 className="text-4xl font-serif italic tracking-tighter bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent">Mapa de Evolução de Massa</h4>
            </div>
            <button 
              onClick={() => setIsAddingMetric(true)}
              className="p-4 bg-gold text-dark-bg rounded-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(226,192,141,0.2)] active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[320px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 8" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#333', fontFamily: 'monospace', letterSpacing: '1px' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#333', fontFamily: 'monospace' }} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#030306', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '2px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                  itemStyle={{ fontSize: '12px', color: '#00f0ff', fontFamily: 'monospace', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '9px', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#00f0ff" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-card-bg p-12 rounded-sm border border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gold/5 blur-[100px] pointer-events-none" />
          <div className="flex items-end justify-between mb-12 relative z-10">
            <div>
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f8e4be] shadow-[0_0_10px_rgba(248,228,190,0.8)]" />
                 <h3 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] font-bold">Logs de Performance</h3>
               </div>
              <h4 className="text-4xl font-serif italic tracking-tighter bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent">Limiares de Ação</h4>
            </div>
            <button 
              onClick={() => setIsAddingExercise(true)}
              className="p-4 bg-cyber-blue text-dark-bg rounded-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(0,240,255,0.2)] active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[320px] pr-6 scrollbar-hide relative z-10">
            {exercises.length > 0 ? exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between p-8 bg-black/40 border border-white/5 rounded-sm hover:border-cyber-blue/30 transition-all group/item cursor-default">
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "p-4 rounded-sm border border-white/5 text-gray-700 transition-all duration-500 group-hover/item:text-cyber-blue group-hover/item:border-cyber-blue/40 group-hover/item:shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-card-bg",
                  )}>
                    {ex.type === 'strength' ? <Dumbbell className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[13px] uppercase tracking-[0.2em] text-white font-bold mb-1.5 group-hover/item:text-cyber-blue transition-colors">{ex.name}</p>
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em] flex items-center gap-3">
                       <span className="text-cyber-blue/40 opacity-70">//</span>
                       {format(parseLocalDate(ex.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-light text-gold tracking-tighter mb-1">
                    {ex.value} <span className="text-[10px] uppercase text-gray-600 font-mono font-bold tracking-widest">{ex.type === 'strength' ? 'kg' : 'km'}</span>
                  </p>
                  {ex.subValue && (
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.1em] font-bold">
                      {ex.type === 'strength' ? `${ex.subValue} iterações` : `${ex.subValue} ciclos`}
                    </p>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-800 gap-6">
                <History className="w-20 h-20 opacity-5" />
                <p className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40 font-bold">Histórico Neural: Limpo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Modal */}
      {isAddingMetric && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-[#e0e0e0]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="bg-card-bg w-full max-w-sm rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 p-10 space-y-12 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="flex items-end justify-between relative z-10">
               <div>
                  <h3 className="text-[10px] font-mono text-gold italic mb-3 tracking-[0.4em] uppercase font-bold opacity-70">Update de Bio-Scan</h3>
                  <h4 className="text-3xl font-serif text-white italic tracking-tighter decoration-gold/20 underline underline-offset-[12px] decoration-1">Ingresso Molecular</h4>
               </div>
              <button onClick={() => setIsAddingMetric(false)} className="p-3 bg-white/5 rounded-sm hover:bg-gold/10 transition-all group">
                <Plus className="w-8 h-8 rotate-45 text-[#333] group-hover:text-gold transition-colors" />
              </button>
            </div>
            <form onSubmit={handleAddMetric} className="space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Massa Estrutural (kg)</label>
                  <input required type="number" step="0.1" value={metricForm.weight} onChange={e => setMetricForm({...metricForm, weight: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-2xl font-light text-gold placeholder-gold/10 shadow-inner" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Concentração Lipídica (%)</label>
                  <input type="number" step="0.1" value={metricForm.bodyFat} onChange={e => setMetricForm({...metricForm, bodyFat: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-2xl font-light text-gold shadow-inner" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Sincronia Temporal</label>
                  <input required type="date" value={metricForm.date} onChange={e => setMetricForm({...metricForm, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 outline-none text-gray-500 font-mono text-[10px] tracking-widest uppercase" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gold text-dark-bg py-6 rounded-sm font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_0_40px_rgba(226,192,141,0.2)] hover:brightness-110 transition-all active:scale-[0.98]">Autorizar Sobrescrita</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Exercise Modal */}
      {isAddingExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-[#e0e0e0]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="bg-card-bg w-full max-w-md rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 p-12 space-y-12 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent" />
            <div className="flex items-end justify-between relative z-10">
               <div>
                  <h3 className="text-[10px] font-mono text-cyber-blue italic mb-3 tracking-[0.4em] uppercase font-bold opacity-70">Protocolo de Engajamento</h3>
                  <h4 className="text-3xl font-serif text-white italic tracking-tighter decoration-cyber-blue/20 underline underline-offset-[12px] decoration-1">Sequência Neural</h4>
               </div>
              <button onClick={() => setIsAddingExercise(false)} className="p-3 bg-white/5 rounded-sm hover:bg-cyber-blue/10 transition-all group">
                <Plus className="w-8 h-8 rotate-45 text-[#333] group-hover:text-cyber-blue transition-colors" />
              </button>
            </div>
            <form onSubmit={handleAddExercise} className="space-y-10 relative z-10">
              <div className="flex gap-6">
                {(['strength', 'aerobic'] as const).map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setExerciseForm({...exerciseForm, type: t})}
                    className={cn(
                      "flex-1 py-5 border rounded-sm text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative overflow-hidden",
                      exerciseForm.type === t ? "bg-cyber-blue border-cyber-blue text-dark-bg font-bold shadow-[0_0_30px_rgba(0,240,255,0.4)]" : "bg-black border-white/5 text-gray-600 hover:border-cyber-blue/40"
                    )}
                  >
                    {t === 'strength' ? 'Tensão' : 'Fluxo'}
                  </button>
                ))}
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Vetor de Atividade</label>
                  <input required type="text" placeholder="Identificar Ação..." value={exerciseForm.name} onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-7 py-5 focus:border-cyber-blue/50 outline-none text-white placeholder-white/5 italic italic font-serif tracking-tight text-xl" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">
                      {exerciseForm.type === 'strength' ? 'Carga (kg)' : 'Volume (km)'}
                    </label>
                    <input required type="number" step="0.1" value={exerciseForm.value} onChange={e => setExerciseForm({...exerciseForm, value: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-cyber-blue/50 outline-none text-2xl font-light text-cyber-blue" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">
                      {exerciseForm.type === 'strength' ? 'Iterações' : 'Ciclos (min)'}
                    </label>
                    <input type="number" value={exerciseForm.subValue} onChange={e => setExerciseForm({...exerciseForm, subValue: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-cyber-blue/50 outline-none text-2xl font-light text-cyber-blue" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Selo de Validação</label>
                  <input required type="date" value={exerciseForm.date} onChange={e => setExerciseForm({...exerciseForm, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 outline-none text-gray-600 font-mono text-[10px] tracking-widest uppercase" />
                </div>
              </div>
              <button type="submit" className="w-full bg-cyber-blue text-dark-bg py-6 rounded-sm font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:brightness-110 transition-all active:scale-[0.98]">Commitar Protocolo</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
