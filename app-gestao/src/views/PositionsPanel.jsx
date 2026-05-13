import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnidades } from '../contexts/UnidadesContext';
import { Modal } from '../components/Modal';
import { Users, Plus, LayoutDashboard, Search, Settings2, Trash2, DownloadCloud, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

const STATUSES = ['Ocupado', 'Vago', 'Substituição'];

export function PositionsPanel() {
  const { regionais: REGIONAIS } = useUnidades();
  const [positions, setPositions] = useState([]);
  const [unitHeadcounts, setUnitHeadcounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [regionalFilter, setRegionalFilter] = useState('Todas');
  const [viewMode, setViewMode] = useState('tactical'); // 'tactical', 'compact', 'list'

  // Form & Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  
  // Para Adicionar novo posto
  const [selectedUnitForNew, setSelectedUnitForNew] = useState(null);
  const [posName, setPosName] = useState('');
  const [posStatus, setPosStatus] = useState('Ocupado');
  const [posComment, setPosComment] = useState('');

  const fetchPositions = async () => {
    setLoading(true);
    // Busca postos
    const { data, error } = await supabase
      .from('unit_positions')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPositions(data);
    }
    
    // Busca headcounts
    const { data: unitsData } = await supabase.from('unidades').select('sigla, headcount');
    if (unitsData) {
      const hData = {};
      unitsData.forEach(u => hData[u.sigla] = u.headcount || 0);
      setUnitHeadcounts(hData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const syncTechnicians = async () => {
    if (!confirm("Isso irá ler todos os técnicos atuais cadastrados no sistema e gerar postos 'Ocupados' para eles neste painel. Deseja continuar?")) return;
    
    setIsSyncing(true);
    
    try {
      // Buscar todos os técnicos
      const { data: techs, error: techsError } = await supabase.from('tecnicos').select('*');
      
      if (techsError) throw techsError;

      const validTechs = techs ? techs.filter(t => t.sigla_unidade && t.nome) : [];

      if (validTechs.length > 0) {
        let insertedCount = 0;
        // 1. Gera Postos Ocupados
        const newPositions = validTechs.filter(t => {
          return !positions.find(p => p.unit_id === t.sigla_unidade && p.position_name === t.nome);
        }).map(t => ({
          unit_id: t.sigla_unidade,
          position_name: t.nome,
          status: 'Ocupado',
          comment: t.cargo ? `Cargo: ${t.cargo}` : ''
        }));

        if (newPositions.length > 0) {
          const { error: insertError } = await supabase.from('unit_positions').insert(newPositions);
          if (insertError) throw insertError;
          insertedCount += newPositions.length;
        }

        // 2. Preenche o restante do Headcount com postos Vagos
        // Pega as posições atualizadas da memória
        const memPositions = [...positions, ...newPositions];
        const missingPositions = [];
        
        Object.entries(unitHeadcounts).forEach(([sigla, hc]) => {
          if (hc > 0) {
            const currentCount = memPositions.filter(p => p.unit_id === sigla).length;
            const diff = hc - currentCount;
            if (diff > 0) {
              for (let i = 0; i < diff; i++) {
                missingPositions.push({
                  unit_id: sigla,
                  position_name: `Posto Vazio ${currentCount + i + 1}`,
                  status: 'Vago',
                  comment: 'Vaga calculada automaticamente pela Matriz de Headcount.'
                });
              }
            }
          }
        });

        if (missingPositions.length > 0) {
          await supabase.from('unit_positions').insert(missingPositions);
          insertedCount += missingPositions.length;
        }

        if (insertedCount > 0) {
          await fetchPositions();
          alert(`${insertedCount} novos postos foram gerados com sucesso!`);
        } else {
          alert("Todos os postos (Ocupados e Vagos) já estão alinhados com a matriz de Headcount.");
        }
      } else {
        alert("Nenhum técnico encontrado no banco de dados para importar.");
      }
    } catch (e) {
      console.error(e);
      alert("Houve um erro na importação: " + e.message);
    }
    
    setIsSyncing(false);
  };

  const updateHeadcount = async (sigla, value) => {
    const val = parseInt(value) || 0;
    setUnitHeadcounts(prev => ({ ...prev, [sigla]: val }));
    await supabase.from('unidades').update({ headcount: val }).eq('sigla', sigla);
  };

  const openNewPosition = (unitSigla) => {
    setSelectedUnitForNew(unitSigla);
    setEditingPos(null);
    
    // Auto-nomear ex: "Técnico 3"
    const unitPos = positions.filter(p => p.unit_id === unitSigla);
    setPosName(`Técnico ${unitPos.length + 1}`);
    setPosStatus('Ocupado');
    setPosComment('');
    
    setIsModalOpen(true);
  };

  const openEditPosition = (pos) => {
    setSelectedUnitForNew(pos.unit_id);
    setEditingPos(pos);
    setPosName(pos.position_name);
    setPosStatus(pos.status);
    setPosComment(pos.comment || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!posName.trim()) return alert("O nome do posto é obrigatório.");

    const payload = {
      unit_id: selectedUnitForNew,
      position_name: posName,
      status: posStatus,
      comment: posStatus === 'Ocupado' ? '' : posComment,
      updated_at: new Date().toISOString()
    };

    if (editingPos) {
      // Atualização Otimista
      setPositions(prev => prev.map(p => p.id === editingPos.id ? { ...p, ...payload } : p));
      await supabase.from('unit_positions').update(payload).eq('id', editingPos.id);
    } else {
      await supabase.from('unit_positions').insert([payload]);
      fetchPositions(); // Precisamos do ID gerado, então refetch
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingPos && confirm("Tem certeza que deseja excluir este posto?")) {
      setPositions(prev => prev.filter(p => p.id !== editingPos.id));
      await supabase.from('unit_positions').delete().eq('id', editingPos.id);
      setIsModalOpen(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'Vago') return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-4 ring-red-200';
    if (status === 'Substituição') return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] ring-4 ring-orange-200';
    return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-100 opacity-90'; // Ocupado
  };

  const filteredPositions = positions.filter(p => 
    p.unit_id.toLowerCase().includes(search.toLowerCase()) || 
    p.position_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.comment && p.comment.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 animate-in fade-in duration-500 p-2 md:p-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            Painel Tático de Vagas
          </h1>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] md:text-xs tracking-widest pl-1 flex items-center gap-4">
            Visão consolidada de postos, faltas e substituições (Headcount)
            
            <button 
              onClick={syncTechnicians}
              disabled={isSyncing}
              className="hidden md:flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[9px] hover:bg-primary transition-colors shadow-sm ml-4"
              title="Gera bolas verdes baseadas nos técnicos do banco"
            >
              <DownloadCloud className="w-3 h-3" /> 
              {isSyncing ? "Sincronizando..." : "Sincronizar Técnicos Atuais"}
            </button>
          </p>
        </div>
        
        <div className="flex gap-4 items-center w-full md:w-auto mt-4 md:mt-0 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto justify-between md:justify-start">
            <button 
              onClick={() => setViewMode('tactical')}
              className={cn("px-3 py-2 rounded-lg flex items-center gap-2 transition-all", viewMode === 'tactical' ? "bg-white shadow text-primary font-bold" : "text-slate-500 hover:text-slate-800")}
              title="Visão Tática (Completa)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest hidden md:inline">Tática</span>
            </button>
            <button 
              onClick={() => setViewMode('compact')}
              className={cn("px-3 py-2 rounded-lg flex items-center gap-2 transition-all", viewMode === 'compact' ? "bg-white shadow text-primary font-bold" : "text-slate-500 hover:text-slate-800")}
              title="Visão Compacta (Densa)"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest hidden md:inline">Compacta</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("px-3 py-2 rounded-lg flex items-center gap-2 transition-all", viewMode === 'list' ? "bg-white shadow text-primary font-bold" : "text-slate-500 hover:text-slate-800")}
              title="Visão em Lista"
            >
              <List className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest hidden md:inline">Lista</span>
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={regionalFilter}
              onChange={(e) => setRegionalFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase italic outline-none text-slate-600 cursor-pointer focus:border-primary transition-all"
            >
              <option value="Todas">Todas Regionais</option>
              {Object.keys(REGIONAIS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar unidade..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      {/* LEGENDA */}
      <div className="flex flex-wrap justify-center md:justify-end gap-6 bg-slate-800 text-white p-4 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
          <span className="text-xs font-black uppercase italic tracking-wider">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]"></div>
          <span className="text-xs font-black uppercase italic tracking-wider">Em Substituição</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
          <span className="text-xs font-black uppercase italic tracking-wider">Vago</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 italic">Carregando mapa tático...</div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Posto / Técnico</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Comentários</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPositions.map(pos => (
                <tr key={pos.id} onClick={() => openEditPosition(pos)} className="hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-wider">
                      {pos.unit_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{pos.position_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", pos.status === 'Ocupado' ? 'bg-emerald-500' : pos.status === 'Vago' ? 'bg-red-500' : 'bg-orange-500')}></div>
                      <span className="text-xs font-bold text-slate-600">{pos.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 italic max-w-md truncate">{pos.comment || '-'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-12 pb-20">
          {Object.entries(REGIONAIS).map(([regName, units]) => {
            if (regionalFilter !== 'Todas' && regName !== regionalFilter) return null;

            const filteredUnits = units.filter(u => 
              u.sigla.toLowerCase().includes(search.toLowerCase()) || 
              u.nome.toLowerCase().includes(search.toLowerCase())
            );

            if (filteredUnits.length === 0) return null;

            return (
              <section key={regName} className="space-y-6 relative">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em] italic">
                    Regional {regName}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className={cn(
                  "grid gap-4",
                  viewMode === 'compact' ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                )}>
                  {filteredUnits.map(unit => {
                    const unitPos = positions.filter(p => p.unit_id === unit.sigla);
                    const warnings = unitPos.filter(p => p.status !== 'Ocupado');
                    
                    return (
                      <div key={unit.sigla} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full group">
                        
                        {/* Header do Card (A Unidade) */}
                        <div className={cn("border-b border-slate-100 flex flex-col bg-slate-50/50", viewMode === 'compact' ? "p-2 gap-1" : "p-4 gap-2")}>
                          <div className="flex justify-between items-start">
                            <div className="overflow-hidden">
                              <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider">
                                {unit.sigla}
                              </span>
                              {viewMode !== 'compact' && <h3 className="font-black text-slate-800 uppercase italic mt-1 leading-tight truncate">{unit.nome}</h3>}
                            </div>
                            {viewMode !== 'compact' && (
                              <button 
                                onClick={() => openNewPosition(unit.sigla)}
                                className="p-2 bg-slate-100 text-slate-500 hover:bg-primary hover:text-white rounded-xl transition-all"
                                title="Adicionar Novo Posto Manualmente"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className={cn("flex items-center justify-between bg-white border border-slate-200 rounded", viewMode === 'compact' ? "p-1 mt-1" : "p-2 mt-2")}>
                            <span className={cn("font-black uppercase text-slate-400", viewMode === 'compact' ? "text-[7px]" : "text-[9px]")}>Vagas</span>
                            <input 
                              type="number"
                              min="0"
                              value={unitHeadcounts[unit.sigla] || 0}
                              onChange={(e) => updateHeadcount(unit.sigla, e.target.value)}
                              className={cn("text-center font-black text-slate-700 bg-slate-50 border border-slate-200 rounded outline-none focus:border-primary", viewMode === 'compact' ? "w-8 text-[9px] p-0.5" : "w-12 text-xs p-1")}
                            />
                          </div>
                        </div>

                        {/* O Campo (Onde ficam as bolas) */}
                        <div className={cn("bg-slate-100/50 flex items-center justify-center border-b border-slate-100", viewMode === 'compact' ? "p-3 min-h-[60px]" : "p-6 min-h-[120px]")}>
                          {unitPos.length === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold uppercase italic text-center px-4">
                              Nenhum posto cadastrado.<br/>Clique no (+) para adicionar o headcount.
                            </p>
                          ) : (
                            <div className={cn("flex flex-wrap justify-center", viewMode === 'compact' ? "gap-1.5" : "gap-4 md:gap-6")}>
                              {unitPos.map((pos) => {
                                const isWarning = pos.status !== 'Ocupado';
                                const warningIndex = isWarning ? warnings.indexOf(pos) + 1 : null;

                                return (
                                  <button
                                    key={pos.id}
                                    onClick={() => openEditPosition(pos)}
                                    className="relative group/bola focus:outline-none"
                                  >
                                    <div className={cn(
                                      "rounded-full flex items-center justify-center text-white font-black transition-transform hover:scale-110",
                                      getStatusStyle(pos.status),
                                      viewMode === 'compact' ? "w-4 h-4 text-[7px]" : "w-10 h-10 md:w-12 md:h-12 text-sm"
                                    )}>
                                      {viewMode !== 'compact' && warningIndex}
                                    </div>
                                    <div className={cn("absolute left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/bola:opacity-100 transition-opacity bg-slate-800 text-white rounded font-bold pointer-events-none z-10", viewMode === 'compact' ? "-bottom-4 text-[7px] px-1 py-0.5" : "-bottom-6 text-[9px] px-2 py-1")}>
                                      {pos.position_name} {isWarning ? `(${pos.status})` : ''}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Comentários/Legendas das ocorrências */}
                        {viewMode === 'tactical' && (
                          <div className="flex-1 p-5 bg-white space-y-3">
                            {warnings.length === 0 && unitPos.length > 0 ? (
                              <div className="text-center py-4 text-[10px] text-emerald-600/70 font-black uppercase tracking-widest italic">
                                Postos 100% Preenchidos
                              </div>
                            ) : (
                            warnings.map((w, index) => (
                              <div key={w.id} className="flex gap-3 text-sm">
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5",
                                  w.status === 'Vago' ? 'bg-red-500' : 'bg-orange-500'
                                )}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-700 leading-tight">{w.position_name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 leading-snug">
                                    {w.comment || (w.status === 'Vago' ? 'Vaga em aberto.' : 'Sem comentário adicional.')}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPos ? `Editar Posto (${selectedUnitForNew})` : `Novo Posto (${selectedUnitForNew})`}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nome/Identificação do Posto</label>
            <input 
              required
              type="text" 
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700" 
              value={posName}
              onChange={e => setPosName(e.target.value)}
              placeholder="Ex: Técnico 1, Líder de Equipe..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Status da Vaga</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPosStatus(s)}
                  className={cn(
                    "p-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2",
                    posStatus === s 
                      ? (s === 'Ocupado' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : s === 'Vago' ? 'border-red-500 bg-red-50 text-red-700' : 'border-orange-500 bg-orange-50 text-orange-700')
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    s === 'Ocupado' ? 'bg-emerald-500' : s === 'Vago' ? 'bg-red-500' : 'bg-orange-500'
                  )}></div>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {posStatus !== 'Ocupado' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Anotações / Substituições</label>
              <textarea 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:border-primary outline-none min-h-[100px] text-slate-600" 
                value={posComment}
                onChange={e => setPosComment(e.target.value)}
                placeholder={posStatus === 'Vago' ? 'Ex: Candidato X fará entrevista dia 20...' : 'Ex: João entra no lugar do Marcos dia 15...'}
              />
            </div>
          )}

          <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
            {editingPos && (
               <button type="button" onClick={handleDelete} className="p-4 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir Posto">
                 <Trash2 className="w-5 h-5" />
               </button>
            )}
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-2xl font-black uppercase text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-[2] p-4 rounded-2xl font-black uppercase text-xs text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
              Salvar Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
