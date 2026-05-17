import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase';
import { Appointment } from '../types';
import { handleFirestoreError, OperationType, cn, parseLocalDate } from '../lib/utils';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function AgendaDashboard({ user }: { user: User }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm')
  });

  useEffect(() => {
    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      orderBy('date', 'asc'),
      orderBy('time', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Sistema de Alerta em Tempo Real (Verifica a cada minuto)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const timeStr = format(now, 'HH:mm');

      appointments.forEach(appt => {
        if (appt.date === dateStr && appt.time === timeStr) {
          // Disparar Notificação visual
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`🚀 GENESIS: ${appt.title}`, {
              body: `Início imediato: ${appt.description || 'Sem detalhes'}`,
              icon: '/favicon.ico'
            });
          }
          // Alerta sonoro/visual dentro do app
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Checa a cada 60 segundos
    return () => clearInterval(interval);
  }, [appointments]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAdding(false);
      setForm({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm')
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja cancelar este compromisso agendado?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'appointments');
    }
  };

  const groupedAppointments = appointments.reduce((acc, appt) => {
    const date = appt.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  return (
    <div className="space-y-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gold/10 border border-gold/30 rounded-sm text-gold shadow-[0_0_20px_rgba(226,192,141,0.25)]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[10px] font-mono text-gold uppercase tracking-[0.4em] font-bold">Cronograma de Atividades</h2>
            <p className="text-gray-600 text-[9px] uppercase tracking-widest italic opacity-60">Sincronização Temporal Progressiva</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-4 bg-gradient-to-r from-[#b8976b] to-[#e2c08d] text-dark-bg px-8 py-4 rounded-sm font-mono font-bold uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(226,192,141,0.2)] hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Timeline List */}
        <div className="xl:col-span-3 space-y-10">
          {sortedDates.length > 0 ? sortedDates.map((date) => (
            <div key={date} className="relative">
              <div className="sticky top-32 z-10 py-4 mb-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "px-4 py-2 border rounded-sm font-mono text-[10px] uppercase tracking-[0.3em] font-bold",
                    isToday(parseLocalDate(date)) 
                      ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                      : "bg-white/5 border-white/10 text-gray-400"
                  )}>
                    {format(parseLocalDate(date), "dd 'de' MMMM", { locale: ptBR })}
                    {isToday(parseLocalDate(date)) && " // HOJE"}
                  </div>
                  <div className="flex-1 h-[1px] bg-white/5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l border-white/5 ml-6">
                {groupedAppointments[date].map((appt) => (
                  <motion.div 
                    key={appt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group bg-card-bg border border-white/5 p-8 rounded-sm hover:border-gold/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(appt.id!)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-start gap-6 mb-6">
                       <div className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(226,192,141,1)] mb-4" />
                          <div className="w-[1px] flex-1 bg-gradient-to-b from-gold/50 to-transparent" />
                       </div>
                       <div>
                          <p className="text-[10px] font-mono text-gold/60 uppercase tracking-[0.2em] mb-2 font-bold flex items-center gap-2">
                             <Clock className="w-3 h-3" />
                             {appt.time}
                          </p>
                          <h3 className="text-2xl font-serif text-white italic tracking-tight mb-3 group-hover:translate-x-2 transition-transform duration-500">
                            {appt.title}
                          </h3>
                       </div>
                    </div>

                    <p className="text-[13px] text-gray-500 font-light leading-relaxed mb-6 border-l-2 border-white/5 pl-6 italic">
                      {appt.description || 'Nenhum detalhe procedimental registrado.'}
                    </p>
                    
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-[#333]">
                       <button 
                         onClick={() => {
                           const message = `*LEMbrete GENESIS*\n\n📌 *Compromisso:* ${appt.title}\n📅 *Data:* ${format(parseLocalDate(appt.date), 'dd/MM/yyyy')}\n⏰ *Hora:* ${appt.time}\n\n📝 *Detalhes:* ${appt.description || 'Nenhum'}`;
                           window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                         }}
                         className="flex items-center gap-2 text-gold/60 hover:text-gold transition-colors"
                       >
                         [ Notificar via WhatsApp ]
                       </button>
                       <ChevronRight className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )) : (
            <div className="py-32 flex flex-col items-center gap-8 opacity-20">
              <Calendar className="w-24 h-24" />
              <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-center">Nenhum evento detectado no radar cronológico</p>
            </div>
          )}
        </div>

        {/* Stats / Quick Info */}
        <div className="xl:col-span-1 border-l border-white/5 pl-12 space-y-12 h-fit sticky top-48">
           <div>
              <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-8 font-bold border-b border-white/5 pb-4">Sumário Temporal</h3>
              <div className="space-y-6">
                 <div className="bg-black/20 p-6 border border-white/5 rounded-sm">
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2 font-bold">Total de Eventos</p>
                    <p className="text-4xl font-serif italic text-white">{appointments.length}</p>
                 </div>
                 <div className="bg-black/20 p-6 border border-white/5 rounded-sm">
                    <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest mb-2 font-bold">Próximo Evento</p>
                    <p className="text-xl font-serif italic text-gold">
                      {appointments.find(a => isFuture(parseLocalDate(a.date)) || isToday(parseLocalDate(a.date)))?.title || 'Nada no Radar'}
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-gold/5 p-8 border border-gold/10 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="w-4 h-4 text-gold" />
                 <span className="text-[9px] font-mono text-gold uppercase tracking-widest font-bold">Info de Segurança</span>
              </div>
              <p className="text-[11px] text-gray-500 font-light leading-relaxed italic">
                Todos os agendamentos são cifrados em repouso e sincronizados através do núcleo Genesis.
              </p>
           </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-[#e0e0e0]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="bg-card-bg w-full max-w-md rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 p-12 space-y-12 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="flex items-end justify-between relative z-10">
               <div>
                  <h3 className="text-[10px] font-mono text-gold italic mb-3 tracking-[0.4em] uppercase font-bold opacity-70">Registro Temporal</h3>
                  <h4 className="text-3xl font-serif text-white italic tracking-tighter underline decoration-gold/20 underline-offset-[12px] decoration-1">Novo Agendamento</h4>
               </div>
              <button onClick={() => setIsAdding(false)} className="p-3 bg-white/5 rounded-sm hover:bg-gold/10 transition-all group">
                <X className="w-8 h-8 text-[#333] group-hover:text-gold transition-colors" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Título do Evento</label>
                  <input required placeholder="Identificar Alvo..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-2xl font-serif italic text-white placeholder-white/5" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Data (D/M/A)</label>
                    <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-base font-mono text-white" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Hora</label>
                    <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-base font-mono text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Diretriz Descritiva</label>
                  <textarea rows={3} placeholder="Protocolos e Detalhes..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-gold/50 outline-none text-base font-light text-gray-400 placeholder-white/5 resize-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gold text-dark-bg py-6 rounded-sm font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_0_40px_rgba(226,192,141,0.2)] hover:brightness-110 transition-all active:scale-[0.98]">Autorizar Registro</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
