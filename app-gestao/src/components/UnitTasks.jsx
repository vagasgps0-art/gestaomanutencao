import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit3, MessageCircle, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './Modal';

const CATEGORIES = ['Ferramenta', 'Uniforme', 'Dúvida/Administrativo', 'Outro'];
const STATUSES = ['Pendente', 'Em Andamento', 'Concluído'];

export function UnitTasks({ unit }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('unit_tasks')
      .select('*')
      .eq('unit_id', unit)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (unit) {
      fetchTasks();
    }
  }, [unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !requester.trim()) return alert("Preencha título e solicitante.");

    const payload = {
      unit_id: unit,
      title,
      description,
      requester,
      category,
      task_date: taskDate,
      updated_at: new Date().toISOString()
    };

    if (editingTask) {
      await supabase.from('unit_tasks').update(payload).eq('id', editingTask.id);
    } else {
      await supabase.from('unit_tasks').insert([payload]);
    }

    setIsModalOpen(false);
    resetForm();
    fetchTasks();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRequester('');
    setCategory(CATEGORIES[0]);
    setTaskDate(new Date().toISOString().split('T')[0]);
    setEditingTask(null);
  };

  const openNewTask = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setRequester(task.requester || '');
    setCategory(task.category || CATEGORIES[0]);
    setTaskDate(task.task_date || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const changeStatus = async (id, newStatus) => {
    // Atualização otimista
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('unit_tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const deleteTask = async (id) => {
    if (confirm("Deseja excluir esta pendência?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
      await supabase.from('unit_tasks').delete().eq('id', id);
    }
  };

  // Agrupando tasks
  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Ferramenta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Uniforme': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dúvida/Administrativo': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 italic">Carregando pendências...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Quadro de Tratativas</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">Acompanhamento de pendências e solicitações</p>
        </div>
        <button 
          onClick={openNewTask}
          className="btn-primary bg-primary text-white shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Pendência
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Coluna PENDENTE */}
        <div className="bg-slate-100/50 rounded-3xl p-4 border border-slate-200/50 min-h-[500px]">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Pendente</h3>
            <span className="ml-auto bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{getTasksByStatus('Pendente').length}</span>
          </div>
          <div className="space-y-4">
            {getTasksByStatus('Pendente').map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditTask(task)} 
                onDelete={() => deleteTask(task.id)}
                onChangeStatus={(status) => changeStatus(task.id, status)}
                colorClass={getCategoryColor(task.category)}
              />
            ))}
            {getTasksByStatus('Pendente').length === 0 && (
              <div className="text-center text-xs text-slate-400 italic py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                Nenhuma pendência nova.
              </div>
            )}
          </div>
        </div>

        {/* Coluna EM ANDAMENTO */}
        <div className="bg-blue-50/50 rounded-3xl p-4 border border-blue-100 min-h-[500px]">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Em Andamento</h3>
            <span className="ml-auto bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{getTasksByStatus('Em Andamento').length}</span>
          </div>
          <div className="space-y-4">
            {getTasksByStatus('Em Andamento').map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditTask(task)} 
                onDelete={() => deleteTask(task.id)}
                onChangeStatus={(status) => changeStatus(task.id, status)}
                colorClass={getCategoryColor(task.category)}
              />
            ))}
             {getTasksByStatus('Em Andamento').length === 0 && (
              <div className="text-center text-xs text-blue-300/60 italic py-10 border-2 border-dashed border-blue-200/50 rounded-2xl">
                Nenhuma pendência em andamento.
              </div>
            )}
          </div>
        </div>

        {/* Coluna CONCLUÍDO */}
        <div className="bg-emerald-50/50 rounded-3xl p-4 border border-emerald-100 min-h-[500px] opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Concluído</h3>
            <span className="ml-auto bg-white text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">{getTasksByStatus('Concluído').length}</span>
          </div>
          <div className="space-y-4">
            {getTasksByStatus('Concluído').map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditTask(task)} 
                onDelete={() => deleteTask(task.id)}
                onChangeStatus={(status) => changeStatus(task.id, status)}
                colorClass={getCategoryColor(task.category)}
              />
            ))}
             {getTasksByStatus('Concluído').length === 0 && (
              <div className="text-center text-xs text-emerald-300/60 italic py-10 border-2 border-dashed border-emerald-200/50 rounded-2xl">
                Sem itens concluídos.
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? "Editar Pendência" : "Nova Pendência"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Título/Resumo da Solicitação</label>
            <input 
              required
              type="text" 
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Solicitou Bota Nº40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Data da Ocorrência/Solicitação</label>
            <input 
              required
              type="date" 
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              value={taskDate}
              onChange={e => setTaskDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Quem Solicitou?</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-primary outline-none" 
                value={requester}
                onChange={e => setRequester(e.target.value)}
                placeholder="Ex: João (Técnico) ou Maria (Analista)"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Categoria</label>
              <select 
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Detalhes Adicionais (Opcional)</label>
            <textarea 
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-primary outline-none min-h-[100px]" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o contexto ou anotações..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 rounded-xl font-black uppercase text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 p-3 rounded-xl font-black uppercase text-xs text-white bg-primary hover:bg-primary/90 transition-colors">
              Salvar Pendência
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Subcomponente Card
function TaskCard({ task, onEdit, onDelete, onChangeStatus, colorClass }) {
  const dateStr = task.task_date 
    ? new Date(task.task_date + 'T12:00:00Z').toLocaleDateString('pt-BR') 
    : new Date(task.created_at).toLocaleDateString('pt-BR');
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group relative">
      <div className="flex justify-between items-start mb-2">
        <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-md border", colorClass)}>
          {task.category}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
             <Edit3 className="w-3.5 h-3.5" />
           </button>
           <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
             <Trash2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
      
      <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{task.title}</h4>
      
      {task.description && (
        <div className="flex items-start gap-1 mt-2 mb-3">
          <MessageCircle className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 line-clamp-2 italic">{task.description}</p>
        </div>
      )}

      <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[9px] font-black uppercase text-slate-400">Solicitante</p>
          <p className="text-xs font-medium text-slate-600">{task.requester}</p>
        </div>
        
        <div className="flex flex-col items-end">
           <p className="text-[9px] text-slate-400 font-mono mb-1">{dateStr}</p>
           <select 
              value={task.status}
              onChange={(e) => onChangeStatus(e.target.value)}
              className="text-[10px] font-black uppercase italic bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 cursor-pointer hover:border-primary transition-colors"
           >
             {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </div>
    </div>
  );
}
