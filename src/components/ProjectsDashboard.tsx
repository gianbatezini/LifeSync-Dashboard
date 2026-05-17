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
  orderBy
} from 'firebase/firestore';
import { 
  Rocket, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ChevronRight,
  Brain,
  Target,
  Layout,
  X
} from 'lucide-react';
import { db } from '../firebase';
import { Project, Checkpoint } from '../types';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

export default function ProjectsDashboard({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
  });

  const [newCheckpoint, setNewCheckpoint] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: projectForm.title,
        description: projectForm.description,
        checkpoints: [],
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddingProject(false);
      setProjectForm({ title: '', description: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'projects');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente esta iniciativa estratégica?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      if (selectedProjectId === id) setSelectedProjectId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'projects');
    }
  };

  const handleAddCheckpoint = async (projectId: string) => {
    if (!newCheckpoint.trim()) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCheckpoints: Checkpoint[] = [
      ...project.checkpoints,
      { id: uuidv4(), title: newCheckpoint, completed: false }
    ];

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        checkpoints: updatedCheckpoints,
        updatedAt: serverTimestamp()
      });
      setNewCheckpoint('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'projects');
    }
  };

  const toggleCheckpoint = async (projectId: string, checkpointId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCheckpoints = project.checkpoints.map(cp => 
      cp.id === checkpointId ? { ...cp, completed: !cp.completed } : cp
    );

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        checkpoints: updatedCheckpoints,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'projects');
    }
  };

  const deleteCheckpoint = async (projectId: string, checkpointId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCheckpoints = project.checkpoints.filter(cp => cp.id !== checkpointId);

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        checkpoints: updatedCheckpoints,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'projects');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-sm text-cyber-blue shadow-[0_0_20px_rgba(0,240,255,0.25)] animate-pulse">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[10px] font-mono text-cyber-blue uppercase tracking-[0.4em] font-bold">Matriz de Objetivos</h2>
            <p className="text-gray-600 text-[9px] uppercase tracking-widest italic opacity-60">Sincronização de Iniciativas em Tempo Real</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-4 bg-gradient-to-r from-cyber-blue to-[#00d8ff] text-dark-bg px-8 py-4 rounded-sm font-mono font-bold uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Projects List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-[1px] bg-cyber-blue/30" />
            <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] font-bold">Fluxo de Iniciativas</h3>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide">
            {projects.length > 0 ? projects.map((project) => (
              <motion.div 
                key={project.id}
                layoutId={project.id}
                onClick={() => setSelectedProjectId(project.id!)}
                className={cn(
                  "p-8 bg-card-bg border rounded-sm transition-all cursor-pointer group relative overflow-hidden",
                  selectedProjectId === project.id 
                    ? "border-cyber-blue shadow-[0_0_30px_rgba(0,240,255,0.15)] bg-white/[0.03]" 
                    : "border-white/5 hover:border-white/20"
                )}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[8px] font-mono text-cyber-blue/60 uppercase tracking-[0.2em] font-bold group-hover:text-cyber-blue transition-colors">
                      Status: {project.status.toUpperCase()}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id!);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xl font-serif text-white italic tracking-tight group-hover:translate-x-2 transition-transform duration-500">{project.title}</h4>
                  
                  <div className="mt-8 space-y-3">
                    <div className="w-full bg-white/5 h-[2px] rounded-full overflow-hidden">
                      <div 
                        className="bg-cyber-blue h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        style={{ width: `${(project.checkpoints.filter(c => c.completed).length / (project.checkpoints.length || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase tracking-widest font-bold">
                       <span>Checkpoint Sync</span>
                       <span>{Math.round((project.checkpoints.filter(c => c.completed).length / (project.checkpoints.length || 1)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="p-12 border border-dashed border-white/10 rounded-sm flex flex-col items-center gap-6 opacity-30">
                <Brain className="w-16 h-16" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-center">Nenhum projeto incubado</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Detail / Checkpoints */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div 
                key={selectedProject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card-bg border border-white/5 rounded-sm p-12 min-h-[600px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-blue/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                
                <div className="mb-14 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                    <h3 className="text-[10px] font-mono text-cyber-blue uppercase tracking-[0.5em] font-bold">Detalhamento de Objetivo</h3>
                  </div>
                  <h2 className="text-5xl font-serif text-white italic tracking-tighter mb-6">{selectedProject.title}</h2>
                  <p className="text-gray-400 font-light text-xl leading-relaxed max-w-2xl border-l border-white/10 pl-8 italic">
                    {selectedProject.description || 'Nenhuma descrição neural adicionada.'}
                  </p>
                </div>

                <div className="space-y-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                       <input 
                        type="text" 
                        placeholder="Adicionar Checkpoint Evolutivo..."
                        value={newCheckpoint}
                        onChange={(e) => setNewCheckpoint(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCheckpoint(selectedProject.id!)}
                        className="w-full bg-black/40 border border-white/5 rounded-sm px-8 py-5 text-lg font-serif italic text-white placeholder:text-gray-800 outline-none focus:border-cyber-blue/30 transition-all pr-24"
                       />
                       <button 
                        onClick={() => handleAddCheckpoint(selectedProject.id!)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-cyber-blue hover:scale-110 transition-transform"
                       >
                         <ChevronRight className="w-6 h-6" />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedProject.checkpoints.map((cp) => (
                      <div 
                        key={cp.id}
                        className={cn(
                          "group flex items-center justify-between p-6 bg-black/20 border rounded-sm transition-all",
                          cp.completed ? "border-[#00ff88]/20 bg-[#00ff88]/5" : "border-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-6">
                           <button 
                            onClick={() => toggleCheckpoint(selectedProject.id!, cp.id)}
                            className={cn(
                              "transition-all duration-500",
                              cp.completed ? "text-[#00ff88]" : "text-gray-700 hover:text-cyber-blue"
                            )}
                           >
                             {cp.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                           </button>
                           <span className={cn(
                             "text-lg transition-all duration-500",
                             cp.completed ? "text-gray-600 line-through italic" : "text-white"
                           )}>
                             {cp.title}
                           </span>
                        </div>
                        <button 
                          onClick={() => deleteCheckpoint(selectedProject.id!, cp.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-all p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {selectedProject.checkpoints.length === 0 && (
                      <div className="py-20 text-center space-y-4 opacity-10">
                        <Target className="w-12 h-12 mx-auto" />
                        <p className="text-[10px] font-mono uppercase tracking-[0.4em] font-bold">Limiar de Checkpoints: Zero</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-card-bg/40 border border-dashed border-white/5 rounded-sm">
                <Layout className="w-24 h-24 text-gray-800 mb-8 animate-pulse" />
                <h3 className="text-[11px] font-mono text-gray-600 uppercase tracking-[0.5em] font-bold mb-4">Aguardando Seleção de Vínculo</h3>
                <p className="text-gray-800 text-[9px] uppercase tracking-widest">Inicie um projeto para visualizar a estrutura neural</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-[#e0e0e0]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="bg-card-bg w-full max-w-md rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 p-12 space-y-12 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent" />
            <div className="flex items-end justify-between relative z-10">
               <div>
                  <h3 className="text-[10px] font-mono text-cyber-blue italic mb-3 tracking-[0.4em] uppercase font-bold opacity-70">Incubação de Iniciativa</h3>
                  <h4 className="text-3xl font-serif text-white italic tracking-tighter decoration-cyber-blue/20 underline underline-offset-[12px] decoration-1">Nova Ideia Neural</h4>
               </div>
              <button onClick={() => setIsAddingProject(false)} className="p-3 bg-white/5 rounded-sm hover:bg-cyber-blue/10 transition-all group">
                <X className="w-8 h-8 text-[#333] group-hover:text-cyber-blue transition-colors" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-10 relative z-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Título do Projeto</label>
                  <input required placeholder="Identificar Alvo..." value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-cyber-blue/50 outline-none text-2xl font-serif italic text-white placeholder-white/5" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Diretriz Descritiva</label>
                  <textarea rows={4} placeholder="Protocolos e Metas..." value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 focus:border-cyber-blue/50 outline-none text-base font-light text-gray-400 placeholder-white/5 resize-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-cyber-blue text-dark-bg py-6 rounded-sm font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:brightness-110 transition-all active:scale-[0.98]">Autorizar Incubação</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
