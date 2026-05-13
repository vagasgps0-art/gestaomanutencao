import React, { useState } from 'react';
import { ShieldCheck, BarChart3, Users, Smartphone, FileSpreadsheet, LayoutGrid, ChevronDown, Search, UserPlus } from 'lucide-react';
import { useUnidades } from '../contexts/UnidadesContext';
import { cn } from '../lib/utils';
export function Sidebar({ onSelectUnit, onShowHome, onShowMaster, onShowTerminal, onShowTechs, onShowMasterTasks, onShowPositions, onShowSync }) {
  const { regionais: REGIONAIS } = useUnidades();
  const [openRegionals, setOpenRegionals] = useState({ "SUL": true });
  const [search, setSearch] = useState("");

  const toggleRegional = (reg) => {
    setOpenRegionals(prev => ({ ...prev, [reg]: !prev[reg] }));
  };

  return (
    <aside className="w-64 bg-primary text-white flex flex-col shadow-2xl z-20 border-r border-white/5 overflow-y-auto h-screen sticky top-0 font-sans print:hidden">
      {/* Logo */}
      <div className="p-6 bg-primary-light text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-accent italic leading-none">Gestão de Ativos</h1>
            <p className="text-[9px] opacity-50 uppercase font-bold tracking-tighter mt-1">Críticos (GAC)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[8px] text-white/30 font-bold tracking-wider uppercase leading-tight">
            © Desenvolvido por Airton Simão DevOps<br/>
            Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {/* Navigation */}
        <section>
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-2 italic">Monitoramento</h3>
          <button 
            onClick={onShowHome}
            className="w-full mb-2 bg-accent text-primary font-black p-3 rounded-xl flex items-center justify-start gap-3 hover:scale-[1.02] transition-all shadow-lg"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs uppercase italic">Visão Geral</span>
          </button>
        </section>

        {/* Catalog & Tools */}
        <section className="space-y-1">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-2 italic">Catálogos & Ativos</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onShowMaster('esteira')}
              className="p-3 col-span-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all text-left flex items-center gap-3"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <p className="text-[9px] font-black uppercase leading-tight italic">Planilha Mestra Esteiras</p>
            </button>
            <button 
              onClick={() => onShowMaster('painel')}
              className="p-3 col-span-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all text-left flex items-center gap-3"
            >
              <LayoutGrid className="w-4 h-4" />
              <p className="text-[9px] font-black uppercase leading-tight italic">Planilha Mestra Painéis</p>
            </button>
            <button 
              onClick={onShowTechs}
              className="p-2 rounded-xl bg-white/5 hover:bg-accent hover:text-primary transition-all text-center group"
            >
              <Users className="w-4 h-4 mx-auto mb-1 opacity-40 group-hover:opacity-100" />
              <p className="text-[7px] font-black uppercase leading-tight">Técnicos</p>
            </button>
            <button 
              onClick={onShowMasterTasks}
              className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all text-center group"
            >
              <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 opacity-40 group-hover:opacity-100" />
              <p className="text-[7px] font-black uppercase leading-tight">Pendências</p>
            </button>
            <button 
              onClick={onShowPositions}
              className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all text-center group"
            >
              <UserPlus className="w-4 h-4 mx-auto mb-1 opacity-40 group-hover:opacity-100" />
              <p className="text-[7px] font-black uppercase leading-tight">Quadro Vagas</p>
            </button>
            <button 
              onClick={onShowTerminal}
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-center group"
            >
              <Smartphone className="w-4 h-4 mx-auto mb-1 opacity-40 group-hover:opacity-100" />
              <p className="text-[7px] font-black uppercase leading-tight">Terminal</p>
            </button>
            <button 
              onClick={onShowSync}
              className="p-3 col-span-2 rounded-xl bg-accent text-primary border border-accent hover:bg-white hover:text-primary transition-all text-left flex items-center gap-3 shadow-[0_0_15px_rgba(255,241,89,0.3)] mt-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <p className="text-[9px] font-black uppercase leading-tight italic">Sincronia Mestre (EXCEL)</p>
            </button>
          </div>
        </section>

        {/* Units Selection */}
        <section>
          <div className="flex justify-between items-center mb-3 px-2 border-b border-white/5 pb-2">
            <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] italic">Unidades</h3>
            <Search className="w-3 h-3 text-white/30" />
          </div>
          <input 
            type="text" 
            placeholder="Filtrar unidade..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-primary-light/50 border-none rounded-lg p-2 text-[10px] text-white outline-none mb-3 italic"
          />
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(REGIONAIS).map(([reg, units]) => {
              const filteredUnits = units.filter(u => 
                u.sigla.toLowerCase().includes(search.toLowerCase()) || 
                u.nome.toLowerCase().includes(search.toLowerCase())
              );

              if (filteredUnits.length === 0) return null;

              return (
                <div key={reg} className="regional-group border-b border-white/5 pb-2">
                  <button 
                    onClick={() => toggleRegional(reg)}
                    className="w-full flex justify-between items-center p-2 text-accent font-black text-[11px] uppercase tracking-widest hover:bg-white/5 rounded-lg"
                  >
                    <span>REGIONAL {reg}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", openRegionals[reg] && "rotate-180")} />
                  </button>
                  {openRegionals[reg] && (
                    <div className="space-y-1 mt-2">
                      {filteredUnits.map(u => (
                        <button 
                          key={u.sigla}
                          onClick={() => onSelectUnit(u.sigla)}
                          className="w-full text-left p-2 pl-4 rounded-lg hover:bg-white/10 transition group"
                        >
                          <span className="text-[9px] font-black text-white/40 block leading-none">{u.sigla}</span>
                          <span className="text-white text-[11px] font-bold">{u.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
