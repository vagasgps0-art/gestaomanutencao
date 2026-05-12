# Contexto do Projeto - Sistema de Gest√£o

## Progresso Recente
- **28/04/2026**: Ajustada a l√≥gica de importa√ß√£o de planilhas (`BulkImport.jsx`) para reconhecer corretamente as colunas "Estoque Real", "Estoque M√≠nimo", "C√≥digo", etc. geradas pela exporta√ß√£o do sistema.
- Com isso, os itens importados da planilha passam a ter suas quantidades corretas cadastradas no banco, deixando de aparecer como "0/0" no portal.
- Como consequ√™ncia, itens importados que est√£o abaixo do estoque m√≠nimo passam a aparecer **automaticamente** na "Lista de Compras", validando-os de forma imediata sem necessidade de edi√ß√£o manual e salvamento.

- **29/04/2026**: Adicionada a nova aba "Estoque" dentro do Dashboard da Unidade.
- A aba "Estoque" lista todo o invent√°rio da unidade de forma independente da lista de compras.
- Instalada a biblioteca `qrcode.react` para gerar um QR Code √∫nico para cada unidade contendo a URL com par√¢metros (ex: `/?unit=SSC1&tab=estoque`).
- O app agora l√™ par√¢metros da URL (`URLSearchParams`) para abrir automaticamente a unidade e a aba corretas quando um t√©cnico escanear o c√≥digo.
- Implementada estiliza√ß√£o `@media print` (classes Tailwind `print:`) para criar um layout de impress√£o limpo contendo apenas o QR Code e a tabela do invent√°rio, ocultando bot√µes, menus laterais e outros elementos de navega√ß√£o.
- **Seguran√ßa e Modo Quiosque**: Adicionada tela de login com senha geral (padr√£o inicial: `admin123`) para proteger o acesso ao painel de administra√ß√£o e edi√ß√µes.
- A URL do QR Code gerado agora possui a flag `&kiosk=true`. Isso libera o acesso do t√©cnico **diretamente √† lista de estoque para impress√£o** sem pedir senha, mas remove completamente a interface lateral (Sidebar), barra de guias e bot√µes do topo para evitar navega√ß√£o n√£o autorizada pelo sistema.

- **30/04/2026**: Implementa√ß√£o do **Formul√°rio de Entrada de Pe√ßas Integrado** para t√©cnicos.
- Criado o componente isolado `TechnicianForm.jsx` que atua como um "Google Forms", por√©m conectado diretamente ao Supabase.
- Quando acessado via `/?view=form&unit=SIGLA`, ele exibe uma interface limpa amig√°vel para celular, ignora a necessidade de login e j√° lista no campo "TAG" apenas os equipamentos reais daquela unidade.
- Adicionado o bot√£o "Abrir Formul√°rio do T√©cnico" no painel da unidade para voc√™ extrair e enviar o link facilmente aos t√©cnicos.

- Adicionada aba 'Central QR' no UnitDashboard contendo QR Codes de visualizaÁ„o e formul·rio com layout otimizado para impress„o (A4).

- Corrigida grafia do nome de analista (Fernando Beckemkamp) no arquivo de configuraÁ„o est·tico.

- Rebranding do sistema para Gest„o de Ativos CrÌticos (GAC) e inserÁ„o de direitos autorais.

- **12/05/2026**: Adicionada a aba 'PendÍncias' no painel das unidades (UnitDashboard.jsx).
- Implementado um Quadro Kanban visual (UnitTasks.jsx) para acompanhamento de solicitaÁıes e tarefas (Ferramentas, Uniformes, etc) categorizadas por status.
- Criada a tabela unit_tasks no Supabase para salvar estas tratativas e vincul·-las a cada unidade.

- Criada a 'Central Mestra de PendÍncias' (MasterTasks.jsx) acessÌvel pelo menu lateral, permitindo visualizaÁ„o, filtro e gest„o de pendÍncias de todas as 25 unidades simultaneamente em formato de tabela interativa.

- Criado o 'Painel T·tico de Vagas' (PositionsPanel.jsx), uma vis„o global estilo 'campo de futebol' para gerenciar o headcount, postos vagos e substituiÁıes, separados por Regional e Unidade.
- Adicionada tabela unit_positions no Supabase.

- Adicionada funcionalidade de SincronizaÁ„o Autom·tica (Bot„o 'Sincronizar TÈcnicos Atuais') no Painel de Vagas para autogerar as posiÁıes com base nos tÈcnicos cadastrados no sistema.

- Adicionada configuraÁ„o de Matriz de Headcount edit·vel por unidade no Painel T·tico de Vagas, gerando postos vagos automaticamente para as cadeiras ociosas.
