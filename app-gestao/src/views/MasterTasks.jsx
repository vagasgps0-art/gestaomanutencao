import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Filter, Search, ClipboardList, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const STATUSES = ['Pendente', 'Em Andamento', 'Concluído'];
const CATEGORIES = ['Todas', 'Ferramenta', 'Uniforme', 'Dúvida/Administrativo', 'Outro'];

export function MasterTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const fetchTasks = async () => {
    setLoading(true);
    // Trazemos todas as tarefas, podemos trazer o nome da unidade se quisermos através de join
    const { data, error } = await supabase
      .from('unit_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const changeStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('unit_tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const deleteTask = async (id) => {
    if (confirm("Deseja realmente excluir esta pendência global?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
      await supabase.from('unit_tasks').delete().eq('id', id);
    }
  };

  // Contagens
  const pendingCount = tasks.filter(t => t.status === 'Pendente').length;
  const progressCount = tasks.filter(t => t.status === 'Em Andamento').length;
  const doneCount = tasks.filter(t => t.status === 'Concluído').length;

  // Filtragem
  const filteredTasks = tasks.filter(t => {
    const matchSearch = 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.unit_id.toLowerCase().includes(search.toLowerCase()) ||
        (t.requester && t.requester.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'Todos' || t.status === statusFilter;
    const matchCategory = categoryFilter === 'Todas' || t.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Ferramenta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Uniforme': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dúvida/Administrativo': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendente': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Em Andamento': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Concluído': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            Central Mestra de Pendências
          </h1>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">
            Visão Global de todas as unidades
          </p>
        </div>
      </header>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Pendentes</p>
             <p className="text-4xl font-black text-red-500">{pendingCount}</p>
           </div>
           <div className="bg-red-50 p-4 rounded-full"><AlertCircle className="w-8 h-8 text-red-400" /></div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Em Andamento</p>
             <p className="text-4xl font-black text-blue-500">{progressCount}</p>
           </div>
           <div className="bg-blue-50 p-4 rounded-full"><Clock className="w-8 h-8 text-blue-400" /></div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Concluídos</p>
             <p className="text-4xl font-black text-emerald-500">{doneCount}</p>
           </div>
           <div className="bg-emerald-50 p-4 rounded-full"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
        </div>
      </div>

      {/* FILTROS E TABELA */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por unidade, título ou solicitante..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 text-[10px] font-black uppercase italic outline-none text-slate-600 rounded-lg px-3 py-2 cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-[10px] font-black uppercase italic outline-none text-slate-600 rounded-lg px-3 py-2 cursor-pointer"
              >
                <option value="Todos">Todos os Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest whitespace-nowrap">Unidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Data / Solicitante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Resumo da Solicitação</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400 italic">Carregando dados globais...</td></tr>
              ) : filteredTasks.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400 italic">Nenhuma pendência encontrada com os filtros atuais.</td></tr>
              ) : (
                filteredTasks.map(t => {
                  const dateStr = t.task_date 
                      ? new Date(t.task_date + 'T12:00:00Z').toLocaleDateString('pt-BR') 
                      : new Date(t.created_at).toLocaleDateString('pt-BR');

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-wider">
                          {t.unit_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">{t.requester}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{dateStr}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-md border whitespace-nowrap", getCategoryColor(t.category))}>
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800 leading-tight">{t.title}</p>
                        {t.description && (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-xs">{t.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(t.status)}
                          <select 
                            value={t.status}
                            onChange={(e) => changeStatus(t.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-black uppercase italic border rounded-lg px-2 py-1 outline-none cursor-pointer transition-colors",
                              t.status === 'Pendente' ? 'bg-red-50 border-red-200 text-red-700' :
                              t.status === 'Em Andamento' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              'bg-emerald-50 border-emerald-200 text-emerald-700'
                            )}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => deleteTask(t.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
