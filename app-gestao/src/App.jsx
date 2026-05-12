import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { UnitDashboard } from './views/UnitDashboard'
import { Home } from './views/Home'
import { TechnicianForm } from './views/TechnicianForm'
import { Modal } from './components/Modal'
import { BulkImport } from './components/BulkImport'
import { MasterAssets } from './views/MasterAssets'
import { MasterTechnicians } from './views/MasterTechnicians'
import { MasterTasks } from './views/MasterTasks'
import { PositionsPanel } from './views/PositionsPanel'

import { Lock } from 'lucide-react'

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialUnit = urlParams.get('unit');
  const isKiosk = urlParams.get('kiosk') === 'true';
  const isForm = urlParams.get('view') === 'form';

  const [isAuthenticated, setIsAuthenticated] = useState(
    isKiosk || isForm || localStorage.getItem('gps_auth') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');

  const [view, setView] = useState(initialUnit ? 'unit-dashboard' : 'home')
  const [selectedUnit, setSelectedUnit] = useState(initialUnit || null)
  const [masterType, setMasterType] = useState('esteira')

  const handleSelectUnit = (sigla) => {
    setSelectedUnit(sigla)
    setView('unit-dashboard')
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      localStorage.setItem('gps_auth', 'true');
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6">
          <div className="text-center">
            <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Acesso Restrito</h1>
            <p className="text-slate-400 text-xs mt-2 uppercase font-bold">Portal de Gestão de Manutenção</p>
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Digite a senha..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-center outline-none focus:border-primary"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white p-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-white hover:text-primary transition-all">
            Entrar
          </button>
        </form>
      </div>
    )
  }

  if (isForm) {
    return <TechnicianForm sigla={selectedUnit} />;
  }

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      {!isKiosk && (
        <Sidebar 
          onSelectUnit={handleSelectUnit}
          onShowHome={() => setView('home')}
          onShowMaster={(type) => { setMasterType(type); setView('master') }}
          onShowTerminal={() => setView('terminal')}
          onShowTechs={() => setView('techs')}
          onShowMasterTasks={() => setView('master-tasks')}
          onShowPositions={() => setView('positions')}
          onShowSync={() => setView('sync')}
        />
      )}

      <main className="flex-1 overflow-y-auto bg-slate-50 relative p-8 print:overflow-visible print:bg-white print:p-0">
        {view === 'home' && !isKiosk && <Home />}
        {view === 'unit-dashboard' && <UnitDashboard sigla={selectedUnit} isKiosk={isKiosk} />}
        {view === 'sync' && (
          <div className="max-w-2xl mx-auto py-10">
            <header className="mb-10">
              <h1 className="text-3xl font-black text-slate-800 uppercase italic">Central de Sincronia</h1>
              <p className="text-slate-500 text-sm italic">Importe dados massivamente via Excel para manter o catálogo atualizado.</p>
            </header>
            <BulkImport onComplete={() => setView('home')} />
          </div>
        )}

        {view === 'master' && <MasterAssets type={masterType} />}
        {view === 'techs' && <MasterTechnicians />}
        {view === 'master-tasks' && <MasterTasks />}
        {view === 'positions' && <PositionsPanel />}
      </main>
    </div>
  )
}

export default App
