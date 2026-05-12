import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AssetCard } from '../components/AssetCard';
import { Smartphone, QrCode, Plus, Users, Edit3, Trash2, ChevronDown, Filter, ShoppingBag, Download, Printer, PackagePlus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { RegisterAsset } from '../components/RegisterAsset';
import { RegisterPart } from '../components/RegisterPart';
import { RegisterTechnician } from '../components/RegisterTechnician';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { getUnidadeBySigla } from '../config/unidades';
import { QRCodeSVG } from 'qrcode.react';
import { UnitTasks } from '../components/UnitTasks';

export function UnitDashboard({ sigla, isKiosk }) {
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'ativos';

  const [data, setData] = useState({ ativos: [], estoque: [], tecnicos: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [addingPartTo, setAddingPartTo] = useState(null);
  const [editingTech, setEditingTech] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [techSort, setTechSort] = useState('nome-asc');

  const unitInfo = getUnidadeBySigla(sigla);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ativosRes, estoqueRes, techsRes] = await Promise.all([
        supabase.from('ativos_unidade').select('*, modelos_equipamento(modelo_chave, tipo, marca)').eq('sigla_unidade', sigla),
        supabase.from('estoque_unidade').select('*').eq('sigla_unidade', sigla),
        supabase.from('tecnicos').select('*').eq('sigla_unidade', sigla)
      ]);

      setData({
        ativos: ativosRes.data || [],
        estoque: estoqueRes.data || [],
        tecnicos: techsRes.data || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sigla) fetchData();
  }, [sigla]);

  const esteiras = data.ativos.filter(a => a.modelos_equipamento?.tipo === 'esteira');
  const paineis = data.ativos.filter(a => a.modelos_equipamento?.tipo === 'painel');

  const exportUnitData = () => {
    const wb = XLSX.utils.book_new();
    
    // 1. Ativos da Unidade
    const ativosData = [...esteiras, ...paineis].map(a => ({
      'Sigla': sigla,
      'Unidade': unitInfo?.nome,
      'TAG': a.tag,
      'Modelo': a.modelos_equipamento?.modelo_chave,
      'Marca': a.modelos_equipamento?.marca,
      'Módulos': a.qtd_modulos,
      'Rastreio': a.codigo_rastreio,
      'Info/Localizacao': a.localizacao || a.info_adicional
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ativosData), "Ativos");

    // 2. Estoque da Unidade
    const estoqueData = data.estoque.map(e => ({
      'Sigla': sigla,
      'Unidade': unitInfo?.nome,
      'TAG_Ativo': e.tag_ativo,
      'Componente': e.componente,
      'Código Klassmatt': e.codigo_item,
      'Estoque Real': e.estoque_real,
      'Estoque Mínimo': e.estoque_obrigatorio,
      'Observação': e.observacao
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(estoqueData), "Estoque");

    XLSX.writeFile(wb, `Dados_${sigla}.xlsx`);
  };
  
  const exportPendingPurchases = () => {
    const pendentes = data.estoque.filter(e => e.estoque_real < e.estoque_obrigatorio);
    if (pendentes.length === 0) return alert("Nenhum item pendente de compra nesta unidade.");

    const ws = XLSX.utils.json_to_sheet(pendentes.map(e => ({
      'Componente': e.componente,
      'Código Klassmatt': e.codigo_item,
      'TAG': e.tag_ativo,
      'Estoque Real': e.estoque_real,
      'Estoque Mínimo': e.estoque_obrigatorio,
      'Quantidade a Comprar': e.estoque_obrigatorio - e.estoque_real,
      'Observação': e.observacao
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista_de_Compra");
    XLSX.writeFile(wb, `Lista_Compra_${sigla}.xlsx`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 italic">
      Carregando dados da unidade...
    </div>
  );

  return (
    <div className="space-y-6">
      {!isKiosk && (
        <header className="mb-8 border-b-4 border-accent pb-6 bg-white p-6 rounded-3xl shadow-sm print:hidden">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">
              {unitInfo?.nome || sigla}
            </h1>
            <p className="text-slate-500 mt-1 font-medium italic text-xs max-w-md">{unitInfo?.endereco || "Endereço não cadastrado"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <div className="bg-blue-50 px-3 py-1 rounded text-[10px] font-black text-blue-900 uppercase">Analista: <span className="text-slate-600 font-normal ml-1">{unitInfo?.analista || "--"}</span></div>
              <div className="bg-slate-50 px-3 py-1 rounded text-[10px] font-black text-slate-400 uppercase">Supervisor: <span className="text-slate-600 font-normal ml-1">{unitInfo?.supervisor || "--"}</span></div>
            </div>
              <button 
                onClick={exportUnitData}
                className="btn-primary bg-emerald-500 text-white shadow-lg flex items-center gap-2"
              >
                <QrCode className="w-3.5 h-3.5" /> Exportar Unitário
              </button>
              <button 
                onClick={() => {
                  setEditingAsset(null);
                  setIsModalOpen(true);
                }}
                className="btn-primary bg-primary text-white shadow-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Ativo
              </button>
              <button 
                onClick={() => window.open(`${import.meta.env.BASE_URL}?view=form&unit=${sigla}`, '_blank')}
                className="btn-primary bg-slate-100 !text-slate-600 border border-slate-200 shadow-none hover:bg-slate-200"
              >
                <PackagePlus className="w-3.5 h-3.5" /> Abrir Formulário do Técnico
              </button>
          </div>
        </div>
      </header>
      )}

      {!isKiosk && (
      <div className="flex gap-2 mb-8 border-b border-slate-200 pb-2 print:hidden">
        <button 
          onClick={() => setTab('ativos')}
          className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm",
            tab === 'ativos' ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          Ativos & Inventário
        </button>
        <button 
           onClick={() => setTab('estoque')}
           className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm",
            tab === 'estoque' ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          Estoque
        </button>
        <button 
           onClick={() => setTab('tecnicos')}
           className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm",
            tab === 'tecnicos' ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          Técnicos
        </button>
        <button 
           onClick={() => setTab('tarefas')}
           className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm",
            tab === 'tarefas' ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          Pendências
        </button>
        <button 
           onClick={() => setTab('compra')}
           className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2",
            tab === 'compra' ? "bg-red-500 text-white" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Lista de Compra
        </button>
        <button 
           onClick={() => setTab('qrcodes')}
           className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2",
            tab === 'qrcodes' ? "bg-accent text-slate-800" : "bg-white text-slate-500 border border-slate-100"
          )}
        >
          <QrCode className="w-3.5 h-3.5" /> Central QR
        </button>
      </div>
      )}

      {tab === 'ativos' && (
        <div className="space-y-10">
          {esteiras.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] mb-4 italic">Esteiras</h2>
              {esteiras.map(a => (
                <AssetCard 
                  key={a.id} 
                  asset={a} 
                  type="esteira" 
                  parts={data.estoque
                    .filter(e => e.tag_ativo === a.tag)
                    .sort((v1, v2) => v1.componente.localeCompare(v2.componente))
                  }
                  onEdit={(asset) => {
                    setEditingAsset({
                      ...asset,
                      modelo_chave: asset.modelos_equipamento?.modelo_chave,
                      marca: asset.modelos_equipamento?.marca,
                      tipo: 'esteira'
                    });
                    setIsModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    if (confirm("Deseja realmente excluir este ativo?")) {
                      await supabase.from('ativos_unidade').delete().eq('id', id);
                      fetchData();
                    }
                  }}
                  onAddPart={(asset) => {
                    setAddingPartTo(asset);
                    setEditingPart(null);
                    setIsModalOpen(true);
                  }}
                  onEditPart={(part) => {
                    setEditingPart(part);
                    setAddingPartTo({ tag: part.tag_ativo });
                    setIsModalOpen(true);
                  }}
                  onDeletePart={async (id) => {
                    if (confirm("Deseja realmente excluir este item?")) {
                      await supabase.from('estoque_unidade').delete().eq('id', id);
                      fetchData();
                    }
                  }}
                />
              ))}
            </section>
          )}
          
          {paineis.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] mb-4 italic">Painéis</h2>
              {paineis.map(a => (
                <AssetCard 
                  key={a.id} 
                  asset={a} 
                  type="painel" 
                  parts={data.estoque
                    .filter(e => e.tag_ativo === a.tag)
                    .sort((v1, v2) => v1.componente.localeCompare(v2.componente))
                  }
                  onEdit={(asset) => {
                    setEditingAsset({
                      ...asset,
                      modelo_chave: asset.modelos_equipamento?.modelo_chave,
                      marca: asset.modelos_equipamento?.marca,
                      tipo: 'painel'
                    });
                    setIsModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    if (confirm("Deseja realmente excluir este ativo?")) {
                      await supabase.from('ativos_unidade').delete().eq('id', id);
                      fetchData();
                    }
                  }}
                  onAddPart={(asset) => {
                    setAddingPartTo(asset);
                    setEditingPart(null);
                    setIsModalOpen(true);
                  }}
                  onEditPart={(part) => {
                    setEditingPart(part);
                    setAddingPartTo({ tag: part.tag_ativo });
                    setIsModalOpen(true);
                  }}
                  onDeletePart={async (id) => {
                    if (confirm("Deseja realmente excluir este item?")) {
                      await supabase.from('estoque_unidade').delete().eq('id', id);
                      fetchData();
                    }
                  }}
                />
              ))}
            </section>
          )}

          {data.ativos.length === 0 && (
             <div className="text-center p-20 text-slate-400 italic">
               Nenhum equipamento cadastrado para esta unidade.
             </div>
          )}
        </div>
      )}

      {tab === 'estoque' && (
        <>
        {/* VIEW DA TELA (Oculto na impressão) */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                 <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?unit=${sigla}&tab=estoque&kiosk=true`} size={80} level="H" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Estoque Completo</h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest">{unitInfo?.nome || sigla}</p>
                <p className="text-[10px] text-primary font-black mt-1 uppercase italic">Escaneie o QR Code para acessar esta lista no celular</p>
              </div>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="btn-primary bg-slate-800 text-white shadow-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Imprimir Lista Atualizada
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Item</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">TAG / Ativo</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic tracking-widest text-center">Atual</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic tracking-widest text-center">Mínimo</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...data.estoque].sort((a, b) => a.componente.localeCompare(b.componente)).map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-800 uppercase italic text-xs">{e.componente}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{e.codigo_item ? `Klassmatt: ${e.codigo_item}` : '---'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{e.tag_ativo}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-slate-700">{e.estoque_real}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{e.estoque_obrigatorio}</td>
                    <td className="px-4 py-3">
                      <p className="text-[9px] text-slate-500 italic max-w-xs">{e.observacao || '---'}</p>
                    </td>
                  </tr>
                ))}
                {data.estoque.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-400 italic">Nenhum item cadastrado no estoque.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW DA IMPRESSÃO (Oculto na tela) */}
        <div className="hidden print:block text-black bg-white w-full">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold uppercase italic tracking-tighter">Inventário de Estoque</h1>
                <p className="text-sm font-bold uppercase tracking-widest mt-1">Unidade: {unitInfo?.nome || sigla}</p>
              </div>
              <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?unit=${sigla}&tab=estoque&kiosk=true`} size={80} level="H" />
            </div>

            <table className="w-full text-left border-collapse border border-black text-xs">
              <thead>
                <tr className="border-b border-black bg-gray-100">
                  <th className="border border-black p-2 font-bold uppercase italic">Item</th>
                  <th className="border border-black p-2 font-bold uppercase italic">TAG</th>
                  <th className="border border-black p-2 font-bold uppercase italic text-center">Atual</th>
                  <th className="border border-black p-2 font-bold uppercase italic text-center">Mínimo</th>
                  <th className="border border-black p-2 font-bold uppercase italic">Observação</th>
                </tr>
              </thead>
              <tbody>
                {[...data.estoque].sort((a, b) => a.componente.localeCompare(b.componente)).map(e => (
                  <tr key={e.id} className="border-b border-black break-inside-avoid">
                    <td className="border border-black p-2">
                      <div className="font-bold uppercase">{e.componente}</div>
                      <div className="text-[10px] mt-1">{e.codigo_item ? `Klassmatt: ${e.codigo_item}` : '-'}</div>
                    </td>
                    <td className="border border-black p-2 uppercase font-mono text-[10px]">{e.tag_ativo}</td>
                    <td className="border border-black p-2 text-center font-bold text-sm">{e.estoque_real}</td>
                    <td className="border border-black p-2 text-center text-sm">{e.estoque_obrigatorio}</td>
                    <td className="border border-black p-2 text-[10px] italic">{e.observacao || '-'}</td>
                  </tr>
                ))}
                {data.estoque.length === 0 && (
                  <tr>
                    <td colSpan="5" className="border border-black p-4 text-center italic">Nenhum item cadastrado no estoque.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-8 text-center text-[10px] text-black italic font-bold">
              © Desenvolvido por Airton Simão DevOps. Todos os direitos reservados.
            </div>
        </div>
        </>
      )}

      {tab === 'tecnicos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/50 p-4 rounded-3xl border border-white/20">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-transparent border-none text-[10px] font-black uppercase italic outline-none text-slate-600 appearance-none cursor-pointer pr-6"
                value={techSort}
                onChange={(e) => setTechSort(e.target.value)}
              >
                <option value="nome-asc">Nome (A-Z)</option>
                <option value="nome-desc">Nome (Z-A)</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setEditingTech(null);
                setIsModalOpen(true);
              }}
              className="btn-primary bg-primary text-white shadow-lg flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Técnico
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...data.tecnicos].sort((a, b) => {
              if (techSort === 'nome-asc') return a.nome.localeCompare(b.nome);
              if (techSort === 'nome-desc') return b.nome.localeCompare(a.nome);
              return 0;
            }).map(t => (
              <div key={t.id} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-900 p-3 rounded-full">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase italic text-sm">{t.nome}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t.cargo}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingTech(t);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tarefas' && (
        <UnitTasks unit={sigla} />
      )}

      {tab === 'compra' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-red-900 uppercase italic leading-none">Necessidade de Compra</h3>
              <p className="text-[10px] text-red-600 font-bold mt-2 uppercase tracking-tight">Itens com estoque real abaixo do obrigatório</p>
            </div>
            <button 
              onClick={exportPendingPurchases}
              className="flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase italic hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
            >
              <Download className="w-4 h-4" /> Baixar Planilha de Compra
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100">Item</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100">TAG / Ativo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100 text-center">Atual</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100 text-center">Mínimo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100 text-center text-red-500">Falta</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-100">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.estoque.filter(e => e.estoque_real < e.estoque_obrigatorio).map(e => (
                  <tr key={e.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-800 uppercase italic text-sm">{e.componente}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{e.codigo_item ? `Klassmatt: ${e.codigo_item}` : '---'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{e.tag_ativo}</span>
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-slate-400">{e.estoque_real}</td>
                    <td className="px-6 py-5 text-center font-bold text-slate-400">{e.estoque_obrigatorio}</td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-red-600 bg-red-100 px-3 py-1 rounded-xl">
                        {e.estoque_obrigatorio - e.estoque_real}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] text-slate-500 italic max-w-xs">{e.observacao || '---'}</p>
                    </td>
                  </tr>
                ))}
                {data.estoque.filter(e => e.estoque_real < e.estoque_obrigatorio).length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-300 italic">Tudo em dia! Nenhum item pendente de compra.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'qrcodes' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:bg-transparent">
          <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-8 print:hidden">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Central de Acessos QR</h2>
              <p className="text-sm text-slate-500 mt-1">Imprima esta página para ter acesso rápido aos recursos da unidade.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="btn-primary bg-primary text-white shadow-lg"
            >
              <Printer className="w-4 h-4" /> Imprimir Folha
            </button>
          </div>

          <div className="hidden print:block text-center mb-10 text-black">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-black inline-block pb-2">Acessos Rápidos - {unitInfo?.nome || sigla}</h1>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-10 print:flex-row print:justify-around print:gap-4 print:mt-12">
            
            {/* QR Code Estoque */}
            <div className="flex flex-col items-center text-center p-8 border-2 border-slate-200 rounded-3xl w-full max-w-sm print:border-4 print:border-black print:w-[45%]">
              <div className="bg-slate-100 p-4 rounded-full mb-4 print:hidden">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800 mb-2 print:text-2xl print:mb-4 print:text-black">Lista de Estoque</h3>
              <p className="text-sm text-slate-500 mb-8 print:text-base print:text-black font-bold leading-tight">Escaneie para visualizar o inventário atualizado em tempo real.</p>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl print:border-none print:p-0">
                <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?unit=${sigla}&tab=estoque&kiosk=true`} size={200} level="H" className="print:w-[250px] print:h-[250px]" />
              </div>
            </div>

            {/* QR Code Formulário */}
            <div className="flex flex-col items-center text-center p-8 border-2 border-slate-200 rounded-3xl w-full max-w-sm print:border-4 print:border-black print:w-[45%]">
              <div className="bg-slate-100 p-4 rounded-full mb-4 print:hidden">
                <PackagePlus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800 mb-2 print:text-2xl print:mb-4 print:text-black">Adicionar Peça</h3>
              <p className="text-sm text-slate-500 mb-8 print:text-base print:text-black font-bold leading-tight">Escaneie para registrar a entrada de novas peças no estoque.</p>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl print:border-none print:p-0">
                <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?view=form&unit=${sigla}`} size={200} level="H" className="print:w-[250px] print:h-[250px]" />
              </div>
            </div>

          </div>
          <div className="hidden print:block mt-16 text-center text-[10px] text-black italic font-bold">
            © Desenvolvido por Airton Simão DevOps. Todos os direitos reservados.
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingAsset(null);
          setAddingPartTo(null);
        }} 
        title={
          editingPart ? `Editar Peça: ${editingPart.componente}` :
          addingPartTo ? `Adicionar Peça: ${addingPartTo.tag}` :
          editingTech ? `Editar Técnico: ${editingTech.nome}` :
          editingAsset ? `Editar Ativo: ${editingAsset.tag}` : 
          "Cadastrar Novo Item"
        }
      >
        {addingPartTo || editingPart ? (
          <RegisterPart 
            unit={sigla}
            assetTag={addingPartTo?.tag || editingPart?.tag_ativo}
            assetType={addingPartTo?.modelos_equipamento?.tipo || editingPart?.tipo || 'esteira'}
            initialData={editingPart}
            onComplete={() => {
              setIsModalOpen(false);
              setAddingPartTo(null);
              setEditingPart(null);
              fetchData();
            }}
          />
        ) : editingTech ? (
          <RegisterTechnician 
            unit={sigla}
            initialData={editingTech}
            onComplete={() => {
              setIsModalOpen(false);
              setEditingTech(null);
              fetchData();
            }}
          />
        ) : (
          <RegisterAsset 
            unit={sigla} 
            initialData={editingAsset}
            onComplete={() => {
              setIsModalOpen(false);
              setEditingAsset(null);
              fetchData();
            }} 
          />
        )}
      </Modal>
    </div>
  );
}
