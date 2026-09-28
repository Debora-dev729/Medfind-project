import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from './ProtectedRoute'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">M</span>
          <span>MediFind <em>Tanzania</em></span>
        </Link>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/search" onClick={() => setMenuOpen(false)}>Search Medicine</NavLink>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          {user ? <><Link className="nav-login" to={getDashboardPath(user.role)} onClick={() => setMenuOpen(false)}>{user.fullName.split(' ')[0]}'s space</Link><button className="nav-register nav-logout" type="button" onClick={() => { logout(); setMenuOpen(false) }}>Log out</button></> : <><Link className="nav-login" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link><Link className="nav-register" to="/register" onClick={() => setMenuOpen(false)}>Create account</Link></>}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
