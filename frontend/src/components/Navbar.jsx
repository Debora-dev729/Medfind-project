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
          {!user && <><NavLink to="/search" onClick={() => setMenuOpen(false)}>Find Medicine</NavLink><Link to="/#about" onClick={() => setMenuOpen(false)}>About</Link><Link className="nav-login" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link><Link className="nav-register" to="/register" onClick={() => setMenuOpen(false)}>Register as Patient</Link></>}
          {user?.role === 'PATIENT' && <><NavLink to="/search" onClick={() => setMenuOpen(false)}>Find Medicine</NavLink><Link to="/patient/dashboard" onClick={() => setMenuOpen(false)}>My dashboard</Link></>}
          {user?.role === 'ADMIN' && <><NavLink to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</NavLink><NavLink to="/admin/pharmacies" onClick={() => setMenuOpen(false)}>Pharmacies</NavLink><NavLink to="/admin/pharmacy-staff" onClick={() => setMenuOpen(false)}>Pharmacy Staff</NavLink><NavLink to="/admin/payments" onClick={() => setMenuOpen(false)}>Payments</NavLink></>}
          {user?.role === 'PHARMACY_STAFF' && <><NavLink to="/pharmacy/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink><NavLink to="/pharmacy/inventory" onClick={() => setMenuOpen(false)}>Inventory</NavLink></>}
          {user && <><Link className="nav-login" to={getDashboardPath(user.role)} onClick={() => setMenuOpen(false)}>{user.fullName.split(' ')[0]}'s space</Link><button className="nav-register nav-logout" type="button" onClick={() => { logout(); setMenuOpen(false) }}>Log out</button></>}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
