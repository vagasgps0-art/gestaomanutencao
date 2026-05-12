export const REGIONAIS = {
  "PRSC": [
    { sigla: "SSC2", nome: "Biguaçu", regional: "PRSC", analista: "Washington", supervisor: "Felipe", endereco: "Rua Edgard Hoffmann, 496 - Biguaçu, SC" },
    { sigla: "SSC3", nome: "Blumenau", regional: "PRSC", analista: "Washington", supervisor: "Felipe", endereco: "Rua Madre Paulina, 560 - Gaspar/SC" },
    { sigla: "SSC5", nome: "Criciúma", regional: "PRSC", analista: "Washington", supervisor: "Felipe", endereco: "Rod. Genésio Mazon, 4 - Morro da Fumaça - SC" },
    { sigla: "SSC8", nome: "Itajaí", regional: "PRSC", analista: "Washington", supervisor: "Felipe", endereco: "SC-412 - Rod. Jorge Lacerda, 1010 - Itajaí/SC" },
    { sigla: "SPR2", nome: "Londrina", regional: "PRSC", analista: "Mayara Mota", supervisor: "Jonas", endereco: "Avenida Tiradentes, N° 7100, Bairro: Jardim Rosicler, Londrina - PR" },
    { sigla: "SPR3", nome: "Cascavel", regional: "PRSC", analista: "Daniel Specht", supervisor: "Jonas", endereco: "Rodovia Federal BR 277, KM 584, Cascavel/PR" },
    { sigla: "SPR4", nome: "Pato Branco", regional: "PRSC", analista: "Daniel Specht", supervisor: "Jonas", endereco: "BR-158 - Vila Esperança, São Bráz - Pato Branco/PR" },
    { sigla: "SPR5", nome: "Guarapuava", regional: "PRSC", analista: "Mayara Mota", supervisor: "Jonas", endereco: "BR-277, KM348 - Jardim das Americas, Guarapuava/PR" },
    { sigla: "SPR6", nome: "Maringa", regional: "PRSC", analista: "Mayara Mota", supervisor: "Jonas", endereco: "CD Mercado Livre - BR 376 - Nº 13595 GL Ribeirão, Maringá - PR" },
    { sigla: "SPR7", nome: "Ponta Grossa", regional: "PRSC", analista: "Mayara Mota", supervisor: "Jonas", endereco: "BR-376, 36000 - Colonia Dona Luiza, Ponta Grossa - PR" },
    { sigla: "SPR8", nome: "Campina Grande do Sul", regional: "PRSC", analista: "Wilson Eliar", supervisor: "Jonas", endereco: "BR-116, 1500, Campina Grande do Sul - PR" },
    { sigla: "SSC1", nome: "Joinville", regional: "PRSC", analista: "Washington", supervisor: "Felipe", endereco: "Rodovia BR 101, nº 46659, Santa Catarina, Joinville/SC" }
  ],
  "RSSC": [
    { sigla: "SSC4", nome: "Chapecó", regional: "RSSC", analista: "Daniel Specht", supervisor: "Felipe", endereco: "BR-158 - Vila Esperança, São Bráz - Pato Branco/PR - Maps" },
    { sigla: "SSC7", nome: "Lages", regional: "RSSC", analista: "Flavio Brum", supervisor: "Felipe", endereco: "R. Bruno Luersen, 873 - Jardim Panorâmico – Lages/ SC" },
    { sigla: "RS01", nome: "METROFULL", regional: "RSSC", analista: "Fabio Linhares", supervisor: "Airton/felipe", endereco: "Av. Borges de Medeiros, 1771 - Sapucaia do Sul - RS" },
    { sigla: "SPR1", nome: "Curitiba", regional: "RSSC", analista: "Daniel Specht", supervisor: "Jonas", endereco: "Rodovia Federal BR 277, KM 584, Lote 391-C-13A, Cascavel/PR - Maps" },
    { sigla: "SRS1", nome: "Porto Alegre", regional: "RSSC", analista: "Flavio Brum", supervisor: "Airton/felipe", endereco: "Rua da Várzea, 481, Jardim São Pedro, Porto Alegre/RS" },
    { sigla: "SRS10", nome: "Estrela", regional: "RSSC", analista: "Fernando Beckemkamp", supervisor: "Airton/felipe", endereco: "BR 386, KM 356, Servidão de Passagem, Estrela/RS" },
    { sigla: "SRS2", nome: "Pelotas", regional: "RSSC", analista: "Fernando Beckemkamp", supervisor: "Airton/felipe", endereco: "Avenida Presidente João Belchior Marques Goulart, 8.831" },
    { sigla: "SRS3", nome: "Santa Maria", regional: "RSSC", analista: "Fernando", supervisor: "Airton/felipe", endereco: "ROD. RST 287, KM 240, Nº 3250 Faixa Nova Camobi" },
    { sigla: "SRS4", nome: "Flores da Cunha", regional: "RSSC", analista: "Flavio Brum", supervisor: "Airton/felipe", endereco: "Estrada das Indústrias, 2030 - Lagoa Bella, Flores de Cunha" },
    { sigla: "SRS5", nome: "Passo Fundo", regional: "RSSC", analista: "Fernando Beckemkamp", supervisor: "Airton/felipe", endereco: "Rua Alôncio de Camargo, 1000 - Integração, Passo Fundo/RS" },
    { sigla: "SRS7", nome: "Ijuí", regional: "RSSC", analista: "Fernando Beckemkamp", supervisor: "Airton/felipe", endereco: "RS-522 n° 280 - Rua Augusto Pestana, Ijuí/RS" },
    { sigla: "SRS8", nome: "Sapucaia do Sul", regional: "RSSC", analista: "Fabio Linhares", supervisor: "Airton/felipe", endereco: "Av. Borges de Medeiros, 1771 - Sapucaia do Sul - RS" },
    { sigla: "SRS9", nome: "Nova Santa Rita", regional: "RSSC", analista: "Fabio Linhares", supervisor: "Airton/felipe", endereco: "BR-277, KM348 - Jardim das Americas, Guarapuava/PR" }
  ]
};

export const getUnidadeBySigla = (sigla) => {
  if (!sigla) return null;
  for (const reg in REGIONAIS) {
    const found = REGIONAIS[reg].find(u => u.sigla.toLowerCase() === sigla.toLowerCase());
    if (found) return found;
  }
  return null;
}
