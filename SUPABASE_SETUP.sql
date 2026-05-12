-- ==========================================================
-- SCRIPT MESTRE DE CONFIGURAÇÃO (RESET GERAL - V3.1)
-- Copie e cole este código no SQL Editor do seu Supabase
-- ==========================================================

-- 1. ESTRUTURA DE TABELAS (GARANTIR COLUNAS NOVAS)
-- ----------------------------------------------------------

-- Adicionar código de rastreio único para Ativos
ALTER TABLE ativos_unidade ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT UNIQUE;

-- Garantir colunas de módulos e localização (casos de migração)
ALTER TABLE ativos_unidade ADD COLUMN IF NOT EXISTS qtd_modulos INTEGER DEFAULT 1;
ALTER TABLE ativos_unidade ADD COLUMN IF NOT EXISTS comprimento_modulo DECIMAL DEFAULT 0;
ALTER TABLE ativos_unidade ADD COLUMN IF NOT EXISTS localizacao TEXT;

-- Ajustes na tabela de estoque para suporte à logística
ALTER TABLE estoque_unidade ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Geral';
ALTER TABLE estoque_unidade ADD COLUMN IF NOT EXISTS data_compra DATE;
ALTER TABLE estoque_unidade ADD COLUMN IF NOT EXISTS previsao_chegada DATE;

-- 2. CONSTRAINTS (GARANTIR INTEGRIDADE)
-- ----------------------------------------------------------

-- Garantir que não existam TAGs duplicadas na mesma unidade
ALTER TABLE ativos_unidade DROP CONSTRAINT IF EXISTS ativos_unidade_tag_sigla_unidade_key;
ALTER TABLE ativos_unidade ADD CONSTRAINT ativos_unidade_tag_sigla_unidade_key UNIQUE (tag, sigla_unidade);

-- Garantir que modelos tenham chaves únicas
ALTER TABLE modelos_equipamento DROP CONSTRAINT IF EXISTS modelos_equipamento_modelo_chave_key;
ALTER TABLE modelos_equipamento ADD CONSTRAINT modelos_equipamento_modelo_chave_key UNIQUE (modelo_chave);

-- Garantir que o estoque seja único por unidade, tag e componente
ALTER TABLE estoque_unidade DROP CONSTRAINT IF EXISTS estoque_unidade_sigla_unidade_tag_ativo_componente_key;
ALTER TABLE estoque_unidade ADD CONSTRAINT estoque_unidade_sigla_unidade_tag_ativo_componente_key UNIQUE (sigla_unidade, tag_ativo, componente);

-- Garantir que a tabela de técnicos exista e tenha os campos necessários
CREATE TABLE IF NOT EXISTS tecnicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigla_unidade TEXT REFERENCES unidades(sigla),
    nome TEXT NOT NULL,
    cargo TEXT,
    cpf TEXT,
    telefone TEXT,
    escala TEXT,
    horario TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir que o CPF do técnico seja único (opcional, mas recomendado)
ALTER TABLE tecnicos DROP CONSTRAINT IF EXISTS tecnicos_cpf_key;
ALTER TABLE tecnicos ADD CONSTRAINT tecnicos_cpf_key UNIQUE (cpf);

-- Garantir que a tabela de pendências/tarefas exista
CREATE TABLE IF NOT EXISTS unit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id TEXT REFERENCES unidades(sigla),
    title TEXT NOT NULL,
    description TEXT,
    requester TEXT,
    category TEXT,
    task_date DATE,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir que a tabela de postos de trabalho exista
CREATE TABLE IF NOT EXISTS unit_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id TEXT REFERENCES unidades(sigla),
    position_name TEXT NOT NULL,
    status TEXT DEFAULT 'Ocupado',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

    sigla TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    regional TEXT NOT NULL,
    analista TEXT,
    supervisor TEXT,
    endereco TEXT,
    headcount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 3. CADASTRO DAS 25 UNIDADES (SINCRONIA TOTAL)
-- ----------------------------------------------------------
INSERT INTO unidades (sigla, nome, regional, analista, supervisor, endereco, headcount)
VALUES 
('SSC3', 'Blumenau', 'PRSC', 'Washington', 'Felipe', 'Rua Madre Paulina, 560 - Gaspar/SC'),
('SSC4', 'Chapecó', 'RSSC', 'Daniel Specht', 'Felipe', 'BR-158 - Vila Esperança, São Bráz - Pato Branco/PR - Maps'),
('SSC5', 'Criciúma', 'PRSC', 'Washington', 'Felipe', 'Rod. Genésio Mazon, 4 - Morro da Fumaça - SC'),
('SSC7', 'Lages', 'RSSC', 'Flavio Brum', 'Felipe', 'R. Bruno Luersen, 873 - Jardim Panorâmico – Lages/ SC'),
('SSC8', 'Itajaí', 'PRSC', 'Washington', 'Felipe', 'SC-412 - Rod. Jorge Lacerda, 1010 - Itajaí/SC'),
('RS01', 'METROFULL', 'RSSC', 'Fabio Linhares', 'Airton/felipe', 'Av. Borges de Medeiros, 1771 - Sapucaia do Sul - RS'),
('SPR1', 'Curitiba', 'RSSC', 'Daniel Specht', 'Jonas', 'Rodovia Federal BR 277, KM 584, Lote 391-C-13A, Cascavel/PR - Maps'),
('SPR2', 'Londrina', 'PRSC', 'Mayara Mota', 'Jonas', 'Avenida Tiradentes, N° 7100, Bairro: Jardim Rosicler, Londrina - PR'),
('SPR3', 'Cascavel', 'PRSC', 'Daniel Specht', 'Jonas', 'Rodovia Federal BR 277, KM 584, Cascavel/PR'),
('SPR4', 'Pato Branco', 'PRSC', 'Daniel Specht', 'Jonas', 'BR-158 - Vila Esperança, São Bráz - Pato Branco/PR'),
('SPR5', 'Guarapuava', 'PRSC', 'Mayara Mota', 'Jonas', 'BR-277, KM348 - Jardim das Americas, Guarapuava/PR'),
('SPR6', 'Maringa', 'PRSC', 'Mayara Mota', 'Jonas', 'CD Mercado Livre - BR 376 - Nº 13595 GL Ribeirão, Maringá - PR'),
('SPR7', 'Ponta Grossa', 'PRSC', 'Mayara Mota', 'Jonas', 'BR-376, 36000 - Colonia Dona Luiza, Ponta Grossa - PR'),
('SPR8', 'Campina Grande do Sul', 'PRSC', 'Wilson Eliar', 'Jonas', 'BR-116, 1500, Campina Grande do Sul - PR'),
('SRS1', 'Porto Alegre', 'RSSC', 'Flavio Brum', 'Airton/felipe', 'Rua da Várzea, 481, Jardim São Pedro, Porto Alegre/RS'),
('SRS10', 'Estrela', 'RSSC', 'Ferando Beckemkamp', 'Airton/felipe', 'BR 386, KM 356, Servidão de Passagem, Estrela/RS'),
('SRS2', 'Pelotas', 'RSSC', 'Ferando Beckemkamp', 'Airton/felipe', 'Avenida Presidente João Belchior Marques Goulart, 8.831'),
('SRS3', 'Santa Maria', 'RSSC', 'Fenando', 'Airton/felipe', 'ROD. RST 287, KM 240, Nº 3250 Faixa Nova Camobi'),
('SRS4', 'Flores da Cunha', 'RSSC', 'Flavio Brum', 'Airton/felipe', 'Estrada das Indústrias, 2030 - Lagoa Bella, Flores de Cunha'),
('SRS5', 'Passo Fundo', 'RSSC', 'Ferando Beckemkamp', 'Airton/felipe', 'Rua Alôncio de Camargo, 1000 - Integração, Passo Fundo/RS'),
('SRS7', 'Ijuí', 'RSSC', 'Ferando Beckemkamp', 'Airton/felipe', 'RS-522 n° 280 - Rua Augusto Pestana, Ijuí/RS'),
('SRS8', 'Sapucaia do Sul', 'RSSC', 'Fabio Linhares', 'Airton/felipe', 'Av. Borges de Medeiros, 1771 - Sapucaia do Sul - RS'),
('SRS9', 'Nova Santa Rita', 'RSSC', 'Fabio Linhares', 'Airton/felipe', 'BR-277, KM348 - Jardim das Americas, Guarapuava/PR'),
('SSC1', 'Joinville', 'PRSC', 'Washington', 'Felipe', 'Rodovia BR 101, nº 46659, Santa Catarina, Joinville/SC')
ON CONFLICT (sigla) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    regional = EXCLUDED.regional,
    analista = EXCLUDED.analista,
    supervisor = EXCLUDED.supervisor,
    endereco = EXCLUDED.endereco;

-- ==========================================================
-- FIM DO SCRIPT
-- ==========================================================

-- ALTER TABLE unidades ADD COLUMN IF NOT EXISTS headcount INTEGER DEFAULT 0;
