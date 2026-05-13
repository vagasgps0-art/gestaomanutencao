import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { UnidadesProvider } from './contexts/UnidadesContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UnidadesProvider>
      <App />
    </UnidadesProvider>
  </React.StrictMode>,
)
