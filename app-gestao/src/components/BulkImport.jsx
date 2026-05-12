import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { REGIONAIS } from '../config/unidades';

export function BulkImport({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const exportRealData = async () => {
    addLog("Preparando exportação de dados reais...", 'info');
    try {
      const wb = XLSX.utils.book_new();
      
      // 1. Unidades
      const { data: unidades } = await supabase.from('unidades').select('*');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(unidades.map(u => ({
        'Sigla': u.sigla, 'Unidade': u.nome, 'Regional': u.regional, 'Analista': u.analista, 'Supervisor': u.supervisor, 'Endereco': u.endereco
      }))), "Unidades");

      // 2. Esteiras
      const { data: ativos } = await supabase.from('ativos_unidade').select('*, unidades(nome), modelos_equipamento(*)');
      const esteiras = ativos.filter(a => a.modelos_equipamento?.tipo === 'esteira');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(esteiras.map(e => ({
        'Sigla': e.sigla_unidade, 'Unidade': e.unidades?.nome, 'TAG': e.tag, 'Modelo_Chave': e.modelos_equipamento?.modelo_chave, 'Marca': e.modelos_equipamento?.marca, 'Qtd_Modulos': e.qtd_modulos, 'Localizacao': e.localizacao, 'Info_Extra': e.info_adicional, 'Codigo_Rastreio': e.codigo_rastreio
      }))), "Esteiras");

      // 3. Painéis
      const paineis = ativos.filter(a => a.modelos_equipamento?.tipo === 'painel');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paineis.map(p => ({
        'Sigla': p.sigla_unidade, 'Unidade': p.unidades?.nome, 'TAG_Painel': p.tag, 'Modelo_Painel': p.modelos_equipamento?.modelo_chave, 'Fabricante': p.modelos_equipamento?.marca, 'Localizacao': p.localizacao, 'Observacoes': p.info_adicional, 'Codigo_Rastreio': p.codigo_rastreio
      }))), "Paineis");

      // 4. DNA
      const { data: modelos } = await supabase.from('modelos_equipamento').select('*, pecas_modelo(*)');
      const dnaData = modelos.flatMap(m => m.pecas_modelo.map(p => ({
        'Modelo_Chave': m.modelo_chave, 'Tipo': m.tipo, 'Item': p.item, 'Código Klassmatt': p.codigo_item, 'Referencia': p.referencia, 'Medida': p.medida, 'Funcao': p.descricao
      })));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dnaData), "DNA");

      // 5. Estoque
      const { data: estoque } = await supabase.from('estoque_unidade').select('*, unidades(nome)');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(estoque.map(s => ({
        'Sigla': s.sigla_unidade, 'Unidade': s.unidades?.nome, 'TAG_Ativo': s.tag_ativo, 'Componente': s.componente, 'Código Klassmatt': s.codigo_item, 'Estoque_Real': s.estoque_real, 'Estoque_Obrigatorio': s.estoque_obrigatorio, 'Observacao': s.observacao, 'Tipo': s.tipo, 'Data_Compra': s.data_compra, 'Previsao_Chegada': s.previsao_chegada
      }))), "Estoque");

      XLSX.writeFile(wb, "PlanilhaMestra_REAL.xlsx");
      addLog("✅ Exportação concluída!", 'success');
    } catch (err) {
      addLog(`❌ Erro exportação: ${err.message}`, 'error');
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // 1. Unidades (Com dados atuais como exemplo)
    const unidadesData = Object.values(REGIONAIS).flat().map(u => ({
      'Sigla': u.sigla, 'Unidade': u.nome, 'Regional': u.regional, 'Analista': u.analista, 'Supervisor': u.supervisor, 'Endereco': u.endereco
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(unidadesData), "Unidades");

    // 2. Esteiras
    const esteirasTemplate = [{
      'Sigla': 'SSC1', 'Unidade': 'Joinville', 'TAG': 'EST01', 'Modelo_Chave': 'EXTENSOR-3000', 'Marca': 'INTERROLL', 'Qtd_Modulos': 1, 'Localizacao': 'Entrada', 'Info_Extra': 'Ajuste fino', 'Codigo_Rastreio': 'RAST-001'
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(esteirasTemplate), "Esteiras");

    // 3. Painéis
    const paineisTemplate = [{
      'Sigla': 'SSC1', 'Unidade': 'Joinville', 'TAG_Painel': 'PAI01', 'Modelo_Painel': 'SIEMENS-S7', 'Fabricante': 'SIEMENS', 'Localizacao': 'Sala Tecnica', 'Observacoes': 'Controla esteiras', 'Codigo_Rastreio': 'RAST-P01'
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paineisTemplate), "Paineis");

    // 4. DNA
    const dnaEstTemplate = [{
      'Modelo_Chave': 'EXTENSOR-3000', 'Item': 'LONA PVC', 'Código Klassmatt': 'LONA-X1', 'Referencia': '3000x500', 'Tamanho': '15', 'Medida': 'M', 'Funcao': 'Transporte'
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dnaEstTemplate), "DNA_Esteiras");

    const dnaPaiTemplate = [{
      'Modelo_Painel': 'SIEMENS-S7', 'Item': 'CONTATORA', 'Codigo_Fabricante': 'C-123', 'Funcao': 'Acionamento'
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dnaPaiTemplate), "DNA_Paineis");

    // 5. Estoque
    const estoqueTemplate = [{
      'Sigla': 'SSC1', 'Unidade': 'Joinville', 'TAG_Ativo': 'EST01', 'Componente': 'ROLAMENTO', 'Código Klassmatt': 'R-001', 'Estoque_Real': 10, 'Estoque_Obrigatorio': 2, 'Observacao': 'Prateleira A1', 'Tipo': 'ESTEIRA', 'Data_Compra': '2024-01-01', 'Previsao_Chegada': ''
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(estoqueTemplate), "Estoque");

    // 6. Técnicos
    const tecnicosTemplate = [{
      'Sigla': 'SSC1', 'Nome': 'AIRTON JUNIOR', 'Cargo': 'COORDENADOR', 'CPF': '000.000.000-00', 'Telefone': '(00) 00000-0000', 'Escala': '6x1', 'Horario': '08:00 - 17:00'
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tecnicosTemplate), "Tecnicos");

    XLSX.writeFile(wb, "Modelo_Importacao_Ativos.xlsx");
  };

  const processFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setLogs([]);
    addLog("Iniciando leitura do arquivo...", 'info');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 1. Processar Unidades
        if (workbook.SheetNames.includes('Unidades')) {
          addLog("Sincronizando Unidades...", 'info');
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Unidades']);
          for (const r of rows) {
            await supabase.from('unidades').upsert({
              sigla: String(r.Sigla), 
              nome: String(r.Unidade), 
              regional: String(r.Regional),
              analista: String(r.Analista || ''), 
              supervisor: String(r.Supervisor || ''), 
              endereco: String(r.Endereco || '')
            }, { onConflict: 'sigla' });
          }
          addLog("✅ Unidades processadas.", 'success');
        }

        // 2. Processar Ativos (Esteiras e Painéis)
        const abasAtivos = [
          { n: 'Esteiras', t: 'esteira', tag: 'TAG', mod: 'Modelo_Chave', marc: 'Marca' }, 
          { n: 'Paineis', t: 'painel', tag: 'TAG_Painel', mod: 'Modelo_Painel', marc: 'Fabricante' }
        ];

        for (const a of abasAtivos) {
          if (workbook.SheetNames.includes(a.n)) {
            addLog(`Sincronizando ${a.n}...`, 'info');
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[a.n]);
            for (const r of rows) {
              // Upsert Modelo
              const { data: m } = await supabase.from('modelos_equipamento').upsert({
                modelo_chave: String(r[a.mod]), 
                tipo: a.t, 
                marca: String(r[a.marc] || 'S/I')
              }, { onConflict: 'modelo_chave' }).select();

              if (m && m[0]) {
                await supabase.from('ativos_unidade').upsert({
                  sigla_unidade: String(r.Sigla), 
                  tag: String(r[a.tag]), 
                  modelo_id: m[0].id,
                  qtd_modulos: r.Qtd_Modulos || 1, 
                  localizacao: r.Localizacao || 'Operação', 
                  info_adicional: r.Info_Extra || r.Observacoes || '',
                  codigo_rastreio: r.Codigo_Rastreio || ''
                }, { onConflict: 'tag,sigla_unidade' });
              }
            }
            addLog(`✅ ${a.n} processados.`, 'success');
          }
        }

        // 3. Processar DNA (Peças do Modelo)
        const abasDNA = [
          { n: 'DNA_Esteiras', m: 'Modelo_Chave' }, 
          { n: 'DNA_Paineis', m: 'Modelo_Painel' }
        ];
        for (const a of abasDNA) {
          if (workbook.SheetNames.includes(a.n)) {
            addLog(`Sincronizando DNA ${a.n}...`, 'info');
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[a.n]);
            for (const r of rows) {
              const { data: m } = await supabase.from('modelos_equipamento')
                .select('id')
                .eq('modelo_chave', String(r[a.m]))
                .maybeSingle();

              if (m) {
                await supabase.from('pecas_modelo').upsert({
                  modelo_id: m.id, 
                  item: String(r.Item), 
                  codigo_item: String(r.Codigo_Item || r.Codigo_Fabricante),
                  referencia: String(r.Referencia || ''), 
                  medida: String(r.Medida || ''),
                  descricao: String(r.Funcao || ''), 
                  is_critico: true
                }, { onConflict: 'modelo_id,item' });
              }
            }
            addLog(`✅ DNA ${a.n} processado.`, 'success');
          }
        }

        // 4. Processar Estoque (Itens vinculados a TAGs)
        if (workbook.SheetNames.includes('Estoque')) {
          addLog("Sincronizando Estoque...", 'info');
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Estoque']);
          for (const r of rows) {
            const sigla = String(r.Sigla || r.Unidade || '').trim().toUpperCase();
            const tag = String(r.TAG_Ativo || r.Tag || r.TAG || 'GERAL').trim().toUpperCase();
            const componente = String(r.Componente || r.Item || '').trim().toUpperCase();

            // Helper for parsing quantities avoiding NaN
            const parseQty = (val) => {
              const p = parseInt(val);
              return isNaN(p) ? 0 : p;
            };

            // Pular se campos essenciais estiverem vazios
            if (!sigla || !componente) continue;

            const { error } = await supabase.from('estoque_unidade').upsert({
              sigla_unidade: sigla,
              tag_ativo: tag || 'GERAL',
              componente: componente,
              codigo_item: String(r['Codigo Klassmatt'] || r['Código Klassmatt'] || r.Codigo_Klassmatt || r.Codigo_Item || r.Codigo || r['Código'] || ''),
              estoque_real: parseQty(r['Estoque Real'] ?? r.Estoque_Real ?? r.Real ?? r.real ?? 0),
              estoque_obrigatorio: parseQty(r['Estoque Mínimo'] ?? r['Estoque Minimo'] ?? r.Estoque_Obrigatorio ?? r.Minimo ?? r.minimo ?? 0),
              observacao: String(r.Observacao || r.Observação || r.OBS || r.obs || ''),
              tipo: String(r.Tipo || 'GERAL').toUpperCase(),
              data_compra: r.Data_Compra || null,
              previsao_chegada: r.Previsao_Chegada || null
            }, { onConflict: 'sigla_unidade,tag_ativo,componente' });

            if (error) {
              addLog(`⚠️ Erro no item ${componente} (${tag}): ${error.message} - ${error.details || ''}`, 'error');
            }
          }
          addLog("✅ Estoque processado.", 'success');
        }

        // 5. Processar Técnicos
        if (workbook.SheetNames.includes('Tecnicos')) {
          addLog("Sincronizando Técnicos...", 'info');
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Tecnicos']);
          for (const r of rows) {
            // Mapeamento flexível para aceitar tanto "Sigla" quanto "Unidade" (vinda da exportação)
            const sigla = r.Sigla || r.Unidade;
            const nome = r.Nome || r.Nome_Completo || r['Nome Completo'];
            const cpf = r.CPF || r.cpf;
            const telefone = r.Telefone || r.telefone;
            const cargo = r.Cargo || r.cargo;
            const escala = r.Escala || r.escala;
            const horario = r.Horario || r.horario || r['Horário'] || r.Horário;

            if (cpf && nome) {
              const { error } = await supabase.from('tecnicos').upsert({
                sigla_unidade: String(sigla),
                nome: String(nome),
                cargo: String(cargo || 'Técnico'),
                cpf: String(cpf),
                telefone: String(telefone || ''),
                escala: String(escala || ''),
                horario: String(horario || '')
              }, { onConflict: 'cpf' });

              if (error) addLog(`⚠️ Erro no técnico ${nome}: ${error.message}`, 'error');
            }
          }
          addLog("✅ Técnicos processados.", 'success');
        }

        addLog("🎉 Sincronização Finalizada com Sucesso!", 'success');
        if (onComplete) setTimeout(onComplete, 2000);

      } catch (err) {
        console.error(err);
        addLog(`❌ Erro no processamento: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative group overflow-hidden">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={processFile}
          disabled={loading}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />
        <div className="space-y-4">
          <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileSpreadsheet className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase italic">Sincronia Mestre (Excel)</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">Arraste sua planilha mestre ou clique para selecionar. Todas as abas (Unidades, Esteiras, Painéis, DNA) serão processadas.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-all bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm"
        >
          <Download className="w-4 h-4" /> Baixar Modelo Vazio
        </button>
        <button 
          onClick={exportRealData}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 hover:text-white hover:bg-emerald-500 transition-all bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" /> Baixar Dados Atuais (Reais)
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] h-48 overflow-y-auto space-y-1 shadow-inner border border-slate-800">
        {logs.length === 0 && <p className="text-slate-600 italic">Aguardando arquivo...</p>}
        {logs.map((log, i) => (
          <div key={i} className={cn(
            "flex gap-3",
            log.type === 'error' ? "text-red-400" : log.type === 'success' ? "text-emerald-400" : "text-blue-300"
          )}>
            <span className="opacity-30">[{log.time}]</span>
            <span>{log.msg}</span>
          </div>
        ))}
      </div>
      
      {loading && (
        <div className="flex items-center justify-center gap-3 text-primary animate-pulse py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] font-black uppercase italic tracking-widest">Processando Banco de Dados...</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
