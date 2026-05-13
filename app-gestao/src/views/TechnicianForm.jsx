import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnidades } from '../contexts/UnidadesContext';
import { PackagePlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function TechnicianForm({ sigla }) {
  const { getUnidadeBySigla } = useUnidades();
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const unitInfo = getUnidadeBySigla(sigla);

  const [formData, setFormData] = useState({
    tag_ativo: '',
    componente: '',
    codigo_item: '',
    estoque_real: 0,
    estoque_obrigatorio: 1,
    observacao: ''
  });

  useEffect(() => {
    const fetchAtivos = async () => {
      try {
        const { data, error } = await supabase
          .from('ativos_unidade')
          .select('tag, modelos_equipamento(tipo)')
          .eq('sigla_unidade', sigla)
          .order('tag');
        
        if (error) throw error;
        setAtivos(data || []);
      } catch (e) {
        console.error("Erro ao buscar ativos:", e);
        setError("Não foi possível carregar a lista de ativos.");
      } finally {
        setLoading(false);
      }
    };

    if (sigla) {
      fetchAtivos();
    } else {
      setError("Unidade não informada no link.");
      setLoading(false);
    }
  }, [sigla]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('estoque') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tag_ativo) {
      alert("Por favor, selecione um ativo (TAG).");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('estoque_unidade')
        .insert([{
          sigla_unidade: sigla,
          tag_ativo: formData.tag_ativo,
          componente: formData.componente,
          codigo_item: formData.codigo_item || null,
          estoque_real: formData.estoque_real,
          estoque_obrigatorio: formData.estoque_obrigatorio,
          observacao: formData.observacao || null
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      // Limpar formulário para a próxima entrada, mas manter a TAG pode ser útil
      setFormData(prev => ({
        ...prev,
        componente: '',
        codigo_item: '',
        estoque_real: 0,
        estoque_obrigatorio: 1,
        observacao: ''
      }));

      // Ocultar sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);

    } catch (e) {
      console.error(e);
      setError("Falha ao salvar a peça. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !ativos.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-slate-800 uppercase italic">Erro no Link</h2>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-primary p-6 text-white text-center shadow-lg sticky top-0 z-10">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 p-3 rounded-2xl">
            <PackagePlus className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-xl font-black uppercase italic tracking-tighter leading-tight">Entrada de Peça</h1>
        <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest mt-1">
          {unitInfo?.nome || sigla}
        </p>
      </header>

      <main className="flex-1 p-4 md:p-6 pb-24 max-w-lg mx-auto w-full">
        {success && (
          <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-800 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-black uppercase italic">Peça adicionada ao estoque!</p>
          </div>
        )}

        {error && !success && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase italic">Ativo (TAG) <span className="text-red-500">*</span></label>
            <select 
              name="tag_ativo" 
              value={formData.tag_ativo} 
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
            >
              <option value="">Selecione a TAG do equipamento</option>
              {ativos.map(a => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} ({a.modelos_equipamento?.tipo || 'Desconhecido'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase italic">Nome da Peça / Componente <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="componente" 
              value={formData.componente} 
              onChange={handleChange}
              required
              placeholder="Ex: Motor de Esteira, Placa Fonte..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase italic">Código Klassmatt <span className="text-slate-400 font-normal normal-case text-[10px]">(Opcional)</span></label>
            <input 
              type="text" 
              name="codigo_item" 
              value={formData.codigo_item} 
              onChange={handleChange}
              placeholder="Ex: COD-12345"
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase italic">Qtd Atual <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="estoque_real" 
                value={formData.estoque_real} 
                onChange={handleChange}
                min="0"
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xl font-black text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase italic">Qtd Mínima <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="estoque_obrigatorio" 
                value={formData.estoque_obrigatorio} 
                onChange={handleChange}
                min="0"
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xl font-black text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase italic">Observação <span className="text-slate-400 font-normal normal-case text-[10px]">(Opcional)</span></label>
            <textarea 
              name="observacao" 
              value={formData.observacao} 
              onChange={handleChange}
              rows="2"
              placeholder="Alguma nota sobre a peça..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-primary text-white p-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-slate-800 transition-all shadow-lg flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackagePlus className="w-5 h-5" />}
            {saving ? 'Salvando...' : 'Adicionar Peça'}
          </button>
        </form>
      </main>
    </div>
  );
}
