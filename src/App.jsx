import './App.css'
import logoJl from './assets/logo-jl.png'

import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tags,
  ChartNoAxesCombined
} from 'lucide-react'

import { Routes, Route, NavLink } from 'react-router'

import Dashboard from './pages/Dashboard'
import Entradas from './pages/Entradas'
import Despesas from './pages/Despesas'
import Categorias from './pages/Categorias'
import Relatorios from './pages/Relatorios'

function App() {
  return (
    <div className="app">

      <aside className="sidebar">

        <div className="marca">
          <img
            src={logoJl}
            alt="Logo JL Espaço & Lazer"
            className="logo-jl"
          />

          <div>
            <h2>JL Gestão</h2>
            <span>Espaço & Lazer</span>
          </div>
        </div>

        <nav className="menu">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'menu-link menu-ativo' : 'menu-link'
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink
            to="/entradas"
            className={({ isActive }) =>
              isActive ? 'menu-link menu-ativo' : 'menu-link'
            }
          >
            <ArrowDownToLine size={20} />
            Entradas
          </NavLink>

          <NavLink
            to="/despesas"
            className={({ isActive }) =>
              isActive ? 'menu-link menu-ativo' : 'menu-link'
            }
          >
            <ArrowUpFromLine size={20} />
            Despesas
          </NavLink>

          <NavLink
            to="/categorias"
            className={({ isActive }) =>
              isActive ? 'menu-link menu-ativo' : 'menu-link'
            }
          >
            <Tags size={20} />
            Categorias
          </NavLink>

          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              isActive ? 'menu-link menu-ativo' : 'menu-link'
            }
          >
            <ChartNoAxesCombined size={20} />
            Relatórios
          </NavLink>

        </nav>

        <div className="sidebar-rodape">
          <p>JL Espaço & Lazer</p>
          <span>Sistema Financeiro</span>
        </div>

      </aside>

      <main className="conteudo">

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entradas" element={<Entradas />} />
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>

      </main>

    </div>
  )
}

export default App