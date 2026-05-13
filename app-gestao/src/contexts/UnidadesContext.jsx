import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UnidadesContext = createContext();

export function UnidadesProvider({ children }) {
  const [regionais, setRegionais] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUnidades = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('unidades').select('*');
    if (!error && data) {
      const reg = {};
      data.forEach(u => {
        const rName = u.regional || 'OUTROS';
        if (!reg[rName]) reg[rName] = [];
        reg[rName].push(u);
      });
      setRegionais(reg);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const getUnidadeBySigla = (sigla) => {
    if (!sigla) return null;
    for (const reg in regionais) {
      const found = regionais[reg].find(u => u.sigla.toLowerCase() === sigla.toLowerCase());
      if (found) return found;
    }
    return null;
  };

  return (
    <UnidadesContext.Provider value={{ regionais, getUnidadeBySigla, loading, refreshUnidades: fetchUnidades }}>
      {children}
    </UnidadesContext.Provider>
  );
}

export const useUnidades = () => useContext(UnidadesContext);
