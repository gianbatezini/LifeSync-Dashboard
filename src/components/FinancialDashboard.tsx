import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  Coffee, 
  Home, 
  CreditCard, 
  Clock,
  Trash2,
  Edit3,
  Filter,
  PieChart as PieChartIcon,
  Search
} from 'lucide-react';
import { db } from '../firebase';
import { Expense, ExpenseCategory, Income } from '../types';
import { handleFirestoreError, OperationType, cn, parseLocalDate } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, startOfMonth, endOfMonth, subDays, isAfter } from 'date-fns';

const CATEGORIES: { id: ExpenseCategory; label: string; icon: any; color: string }[] = [
  { id: 'fixed', label: 'Gastos Fixos', icon: Clock, color: '#ff4444' },
  { id: 'home', label: 'Casa & Moradia', icon: Home, color: '#ff8844' },
  { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, color: '#ff0055' },
  { id: 'variable', label: 'Lazer & Variáveis', icon: Coffee, color: '#ffaa00' },
];

export default function FinancialDashboard({ user }: { user: User }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: 'variable' as ExpenseCategory,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [timeframe, setTimeframe] = useState<7 | 15 | 30>(30);

  useEffect(() => {
    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      limit(200)
    );

    const qIncomes = query(
      collection(db, 'incomes'),
      where('userId', '==', user.uid),
      limit(200)
    );

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'expenses'));

    const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
      setIncomes(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'incomes'));

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
    };
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = addType === 'expense' ? 'expenses' : 'incomes';
    const payload: any = {
      userId: user.uid,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      updatedAt: serverTimestamp()
    };

    if (addType === 'expense') {
      payload.category = formData.category;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, collectionName), payload);
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ amount: '', category: 'variable', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, collectionName);
    }
  };

  const handleEdit = (item: any, type: 'expense' | 'income') => {
    setAddType(type);
    setEditingId(item.id);
    setFormData({
      amount: item.amount.toString(),
      category: item.category || 'variable',
      description: item.description,
      date: item.date
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string, type: 'expense' | 'income') => {
    const colName = type === 'expense' ? 'expenses' : 'incomes';
    
    // Log para depuração
    console.log(`Tentando excluir ${id} de ${colName}`);

    try {
      if (!id) throw new Error('Identificador único não localizado.');
      await deleteDoc(doc(db, colName, id));
      console.log(`Sucesso: ${id} removido.`);
    } catch (err: any) {
      console.error(`Falha ao deletar em ${colName}:`, err);
      const errorMessage = err.message || 'Erro desconhecido ao tentar excluir.';
      alert(`Erro ao excluir registrado: ${errorMessage}`);
      handleFirestoreError(err, OperationType.DELETE, colName);
    }
  };

  const recentTransactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...incomes.map(i => ({ ...i, type: 'income' as const }))
  ].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
   .slice(0, 15);

  const currentMonthExpenses = expenses.filter(e => {
    const d = parseLocalDate(e.date);
    return d >= startOfMonth(new Date()) && d <= endOfMonth(new Date());
  });

  const currentMonthIncomes = incomes.filter(i => {
    const d = parseLocalDate(i.date);
    return d >= startOfMonth(new Date()) && d <= endOfMonth(new Date());
  });

  const totalIncome = currentMonthIncomes.reduce((sum, curr) => sum + curr.amount, 0);

  const totals = currentMonthExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    acc.totalExpenses = (acc.totalExpenses || 0) + curr.amount;
    return acc;
  }, { totalExpenses: 0 } as Record<string, number>);

  const balance = totalIncome - (totals.totalExpenses || 0);

  const pieData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: totals[cat.id] || 0,
    color: cat.color
  })).filter(d => d.value > 0);

  const allTransactionsForChart = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...incomes.map(i => ({ ...i, type: 'income' as const }))
  ].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  const cutoffDate = subDays(new Date(), timeframe);
  
  // Calculate initial balance before timeframe
  let currentBalance = allTransactionsForChart
    .filter(t => !isAfter(parseLocalDate(t.date), cutoffDate))
    .reduce((acc, curr) => acc + (curr.type === 'income' ? curr.amount : -curr.amount), 0);

  const chartData = allTransactionsForChart
    .filter(t => isAfter(parseLocalDate(t.date), cutoffDate))
    .reduce((acc, curr) => {
      const change = curr.type === 'income' ? curr.amount : -curr.amount;
      currentBalance += change;
      
      const dateStr = format(parseLocalDate(curr.date), 'dd/MM');
      const existingIndex = acc.findLastIndex(item => item.name === dateStr);
      
      if (existingIndex !== -1) {
        acc[existingIndex].balance = currentBalance;
      } else {
        acc.push({ name: dateStr, balance: currentBalance });
      }
      return acc;
    }, [] as { name: string, balance: number }[]);

  return (
    <div className="space-y-12">
      {/* Quick Summary Cards - Refined for Dark Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Receita Mensal Card */}
        <div className="bg-card-bg p-8 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden group hover:border-[#00ff88]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff88]/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-[#00ff88]/10 transition-colors" />
          <div className="flex items-start justify-between relative z-10 mb-8">
             <div className="w-1.5 h-6 rounded-full bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
             <TrendingUp className="w-6 h-6 text-[#00ff88]" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-2 font-bold">Fluxo de Entradas</p>
            <h3 className="text-4xl font-light tracking-tighter text-white">
              <span className="text-xs text-[#00ff88] mr-3 uppercase font-mono font-bold opacity-80">R$</span>
              {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <button 
              onClick={() => { setAddType('income'); setIsAdding(true); }}
              className="mt-6 flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#00ff88] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> Adicionar Entrada
            </button>
          </div>
        </div>

        {/* Despesa Mensal Card */}
        <div className="bg-card-bg p-8 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden group hover:border-[#ff4444]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff4444]/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-[#ff4444]/10 transition-colors" />
          <div className="flex items-start justify-between relative z-10 mb-8">
             <div className="w-1.5 h-6 rounded-full bg-[#ff4444] shadow-[0_0_15px_rgba(255,68,68,0.6)]" />
             <CreditCard className="w-6 h-6 text-[#ff4444]" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-[#ff4444] uppercase tracking-[0.4em] mb-2 font-bold opacity-80">Carga de Saída</p>
            <h3 className="text-4xl font-light tracking-tighter text-white">
              <span className="text-xs text-[#ff4444] mr-3 uppercase font-mono font-bold opacity-80">R$</span>
              {totals.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <button 
              onClick={() => { setAddType('expense'); setIsAdding(true); }}
              className="mt-6 flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#ff4444] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> Adicionar Saída
            </button>
          </div>
        </div>

        {/* Saldo Líquido Card */}
        <div className={cn(
          "p-8 rounded-sm border shadow-2xl relative overflow-hidden group transition-all duration-500",
          balance >= 0 ? "bg-card-bg border-white/5 hover:border-green-500/30" : "bg-red-500/5 border-red-500/10 hover:border-red-500/30"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-2xl transition-colors",
            balance >= 0 ? "bg-green-500/5 group-hover:bg-green-500/10" : "bg-red-500/5 group-hover:bg-red-500/10"
          )} />
          <div className="flex items-start justify-between relative z-10 mb-8">
             <div className={cn(
               "w-1.5 h-6 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)]",
               balance >= 0 ? "bg-green-500" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
             )} />
             <ArrowUpRight className={cn(
               "w-6 h-6",
               balance >= 0 ? "text-green-500" : "text-red-500"
             )} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-2 font-bold">Fluxo de Saldo</p>
            <h3 className={cn(
              "text-4xl font-light tracking-tighter",
              balance >= 0 ? "text-white" : "text-red-400"
            )}>
              <span className="text-xs mr-3 uppercase font-mono font-bold opacity-80">R$</span>
              {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="mt-6 text-[9px] font-mono uppercase tracking-[0.2em] text-gray-600 font-bold">Status: <span className={balance >= 0 ? "text-green-500" : "text-red-500"}>{balance >= 0 ? 'POSITIVO' : 'CRÍTICO'}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-card-bg p-12 rounded-sm border border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.4)] space-y-12">
          <div className="flex items-end justify-between">
            <div>
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f8e4be] shadow-[0_0_10px_rgba(248,228,190,0.8)]" />
                 <h3 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] font-bold">Evolução de Gastos</h3>
               </div>
              <h4 className="text-3xl font-serif italic tracking-tighter bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent">Histórico de Movimentação</h4>
            </div>
            <div className="flex gap-4">
               <div className="flex bg-black/40 p-1 rounded-sm border border-white/5">
                 {([7, 15, 30] as const).map((t) => (
                   <button
                     key={t}
                     onClick={() => setTimeframe(t)}
                     className={cn(
                       "px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all",
                       timeframe === t 
                        ? "bg-[#00f0ff] text-dark-bg font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]" 
                        : "text-gray-500 hover:text-gray-300"
                     )}
                   >
                     {t === 30 ? 'Mensal' : `${t}D`}
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                <defs>
                   <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                   </linearGradient>
                   <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="50%" stopColor="#00d8ff" />
                      <stop offset="100%" stopColor="#00b0ff" />
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 10" vertical={false} stroke="rgba(255,255,255,0.01)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#666', fontFamily: 'monospace', letterSpacing: '1px' }} 
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#666', fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#030306', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '4px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}
                  itemStyle={{ fontSize: '13px', color: '#00f0ff', fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '9px', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold' }}
                  cursor={{ stroke: 'rgba(0,240,255,0.1)', strokeWidth: 1 }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo em Conta']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#00f0ff', shadow: '0 0 20px #00f0ff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-card-bg p-12 rounded-sm border border-white/5 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff4444]/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
          <div className="mb-12 relative z-10">
            <h3 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] mb-4 font-bold opacity-80">Divisão por Categoria</h3>
            <h4 className="text-2xl font-serif italic tracking-tighter bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent underline decoration-white/5 underline-offset-8 decoration-2">Resumo de Despesas</h4>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
            {pieData.length > 0 ? (
              <>
                <div className="h-[280px] w-full filter drop-shadow-[0_0_30px_rgba(255,68,68,0.1)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={90}
                        outerRadius={115}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="#030306"
                        strokeWidth={6}
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#030306', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                  <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.5em] mb-2 font-bold">Total Saídas</p>
                  <p className="text-3xl font-light text-white font-serif tracking-tighter">
                     <span className="text-xs text-gray-600 mr-1 italic">R$</span>
                     {(totals.totalExpenses || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-6 text-gray-800">
                <PieChartIcon className="w-20 h-20 opacity-5" />
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] font-bold">Sem dados registrados</p>
              </div>
            )}
            
            <div className="w-full space-y-5 mt-10 relative z-10">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] group-hover/item:text-white transition-colors duration-300 font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-[1px] bg-white/5" />
                     <span className="text-[12px] font-mono font-bold text-gray-400 group-hover/item:text-[#ff4444] transition-colors">
                        {((item.value / totals.totalExpenses) * 100).toFixed(1)}%
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-card-bg p-12 rounded-sm border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
        <div className="flex items-end justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f8e4be] shadow-[0_0_10px_rgba(248,228,190,0.8)]" />
              <h3 className="text-[10px] font-mono text-[#a68b5e] uppercase tracking-[0.6em] font-bold">Transações Recentes</h3>
            </div>
            <h4 className="text-3xl font-serif italic tracking-tighter bg-gradient-to-b from-[#f8e4be] via-[#e2c08d] to-[#b8976b] bg-clip-text text-transparent">Histórico de Lançamentos</h4>
          </div>
          <div className="flex gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-700 group-focus-within:text-cyber-blue transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filtrar registros..." 
                  className="bg-black/50 border border-white/5 rounded-full py-3 pl-10 pr-6 text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500 focus:border-white/30 outline-none w-64 transition-all"
                />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-gray-600 uppercase tracking-[0.4em]">
                <th className="pb-6 font-bold">Data</th>
                <th className="pb-6 font-bold">Descrição</th>
                <th className="pb-6 font-bold">Direção</th>
                <th className="pb-6 font-bold text-right">Valor</th>
                <th className="pb-6 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-white/5">
              {recentTransactions.length > 0 ? recentTransactions.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors border-transparent border-l-2 hover:border-[#00ff88]/30">
                  <td className="py-6 text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-widest">{format(parseLocalDate(item.date), 'dd.MM')}</td>
                  <td className="py-6">
                    <div className="flex flex-col">
                      <span className="text-white italic font-serif text-base tracking-tight mb-1">{item.description}</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">
                        {item.type === 'expense' ? (CATEGORIES.find(c => c.id === (item as any).category)?.label || 'Outros') : 'Entrada de Capital'}
                      </span>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border shadow-[0_0_10px_currentColor]",
                      item.type === 'expense' ? "text-[#ff4444] border-[#ff4444]/20" : "text-[#00ff88] border-[#00ff88]/20"
                    )}>
                      {item.type === 'expense' ? 'SAÍDA' : 'ENTRADA'}
                    </span>
                  </td>
                  <td className={cn(
                    "py-6 text-right text-lg font-light tracking-tighter",
                    item.type === 'expense' ? "text-white" : "text-[#00ff88]"
                  )}>
                    <span className="text-[10px] mr-1 opacity-50 font-bold uppercase">R$</span>
                    {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item, item.type)}
                        className={cn(
                          "p-3 bg-white/5 rounded-sm transition-all",
                          item.type === 'expense' ? "hover:bg-[#ff4444]/20 hover:text-[#ff4444]" : "hover:bg-[#00ff88]/20 hover:text-[#00ff88]"
                        )}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.id) handleDelete(item.id, item.type);
                          else alert('Erro: Dado sem identificador de registro.');
                        }}
                        className="p-3 bg-white/5 rounded-sm hover:bg-red-500/20 hover:text-red-500 transition-all text-red-400"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center opacity-20 italic font-serif text-2xl tracking-tighter">Não há registros detectados no sistema...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Dark Form Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-[#e0e0e0]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="bg-card-bg w-full max-w-lg rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 p-12 space-y-12 relative overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-transparent to-transparent",
              addType === 'expense' ? "via-[#ff4444]" : "via-[#00ff88]"
            )} />
            <div className="flex items-end justify-between relative z-10">
               <div>
                  <h3 className={cn(
                    "text-[10px] font-mono italic mb-3 tracking-[0.4em] uppercase font-bold opacity-70",
                    addType === 'expense' ? "text-[#ff4444]" : "text-[#00ff88]"
                  )}>
                    {editingId ? 'Sincronizar Modificação' : (addType === 'expense' ? 'Protocolo de Saída' : 'Protocolo de Entrada')}
                  </h3>
                  <h4 className={cn(
                    "text-3xl font-serif text-white italic tracking-tighter underline underline-offset-[12px] decoration-1",
                    addType === 'expense' ? "decoration-[#ff4444]/20" : "decoration-[#00ff88]/20"
                  )}>
                    {editingId ? 'Edição de Lançamento' : (addType === 'expense' ? 'Nova Saída' : 'Nova Entrada')}
                  </h4>
               </div>
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }} 
                className={cn(
                  "p-3 bg-white/5 rounded-sm transition-all group",
                  addType === 'expense' ? "hover:bg-[#ff4444]/10" : "hover:bg-[#00ff88]/10"
                )}
              >
                <Plus className="w-8 h-8 rotate-45 text-[#333] group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="flex gap-4 mb-2">
              {(['expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={!!editingId}
                  onClick={() => setAddType(type)}
                  className={cn(
                    "flex-1 py-3 border rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all",
                    addType === type 
                      ? (type === 'expense' 
                          ? "bg-[#ff4444] border-[#ff4444] text-dark-bg font-bold shadow-[0_0_20px_rgba(255,68,68,0.3)]" 
                          : "bg-[#00ff88] border-[#00ff88] text-dark-bg font-bold shadow-[0_0_20px_rgba(0,255,136,0.3)]")
                      : "bg-black border-white/5 text-gray-600 hover:border-white/20",
                    editingId && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {type === 'expense' ? 'Saída' : 'Entrada'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className={cn(
                      "w-full bg-black border border-white/10 rounded-sm px-7 py-5 outline-none text-2xl font-light placeholder-white/5 shadow-inner transition-all",
                      addType === 'expense' ? "focus:border-[#ff4444]/50 text-[#ff4444]" : "focus:border-[#00ff88]/50 text-[#00ff88]"
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Data do Lançamento</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 outline-none text-gray-500 font-mono text-[10px] tracking-widest uppercase"
                  />
                </div>
              </div>

              {addType === 'expense' && (
                <div className="space-y-4">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Categoria</label>
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.id})}
                        className={cn(
                          "flex items-center gap-5 px-6 py-5 border rounded-sm transition-all text-[10px] font-mono uppercase tracking-[0.2em] text-left relative overflow-hidden group/cat",
                          formData.category === cat.id 
                            ? "bg-[#ff4444] border-[#ff4444] text-dark-bg font-bold shadow-[0_0_30px_rgba(255,68,68,0.3)]" 
                            : "bg-black border-white/5 text-gray-600 hover:border-[#ff4444]/40"
                        )}
                      >
                        <cat.icon className={cn("w-4 h-4", formData.category === cat.id ? "text-dark-bg" : "text-gray-700")} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Aluguel, Supermercado..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className={cn(
                    "w-full bg-black border border-white/10 rounded-sm px-7 py-5 outline-none text-white placeholder-white/5 italic font-serif tracking-tight text-xl transition-all",
                    addType === 'expense' ? "focus:border-[#ff4444]/50" : "focus:border-[#00ff88]/50"
                  )}
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  className={cn(
                    "w-full py-7 rounded-sm font-bold uppercase tracking-[0.4em] text-[11px] transition-all active:scale-[0.98]",
                    addType === 'expense' 
                      ? "bg-[#ff4444] text-dark-bg shadow-[0_0_40px_rgba(255,68,68,0.2)] hover:brightness-110" 
                      : "bg-[#00ff88] text-dark-bg shadow-[0_0_40px_rgba(0,255,136,0.2)] hover:brightness-110"
                  )}
                >
                  {editingId ? 'Confirmar Alteração' : 'Salvar Transação'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
