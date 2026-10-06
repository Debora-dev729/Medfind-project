import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const location = useLocation()
  const [form, setForm] = useState({ email: location.state?.email || '', password: '', remember: false })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }

    try {
      const user = await login(form)
      const destination = user.role === 'PHARMACY_STAFF' && user.mustChangePassword
        ? '/pharmacy/change-password'
        : location.state?.from || getDashboardPath(user.role)
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel auth-intro">
        <p className="eyebrow"><span /> Welcome back</p>
        <h1>Keep your medicine search moving.</h1>
        <p>Sign in to manage reservations and keep your trusted pharmacy information close at hand.</p>
        <div className="auth-trust"><span>✓</span><div><strong>Trusted by patients across Tanzania</strong><small>Simple, transparent medicine access.</small></div></div>
      </div>
      <div className="auth-panel auth-form-panel">
        <p className="eyebrow">MediFind account</p>
        <h2>Log in to MediFind</h2>
        <p className="auth-subtitle">Enter your details to continue.</p>
        {location.state?.registered && <div className="auth-message" role="status">Account created. Log in to open your MediFind workspace.</div>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address<input id="login-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required /></label>
          <label htmlFor="login-password">Password<input id="login-password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" required /></label>
          <div className="auth-options"><label className="checkbox-label"><input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} /> Remember me</label><a href="#forgot-password">Forgot password?</a></div>
          <button className="button button-primary" type="submit">Log in <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to MediFind? <Link to="/register" state={{ from: location.state?.from }}>Register as a patient</Link></p>
      </div>
    </section>
  )
}

function getDashboardPath(role) {
  if (role === 'PHARMACY_STAFF') return '/pharmacy/dashboard'
  if (role === 'ADMIN') return '/admin/dashboard'
  return '/patient/dashboard'
}

export default Login
