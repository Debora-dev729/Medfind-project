import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const initialForm = { fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'PATIENT' }

function Register() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const { register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.fullName.trim()) nextErrors.fullName = 'Enter your full name.'
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (!form.phone.trim()) nextErrors.phone = 'Enter your phone number.'
    if (!form.password) nextErrors.password = 'Create a password.'
    else if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.'
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    try {
      await register({ ...form, role: 'PATIENT' })
      navigate(location.state?.from || '/search', { replace: true })
    } catch (error) {
      setSubmitError(error.message)
    }
  }

  return (
    <section className="auth-page auth-register-page">
      <div className="auth-panel auth-intro">
        <p className="eyebrow"><span /> Join MediFind</p>
        <h1>Make your next pharmacy visit easier.</h1>
        <p>Create a free account to save reservations and stay connected to the medicines you need.</p>
        <div className="auth-feature-list"><span>01</span><p><strong>Search smarter</strong><small>Compare availability before you travel.</small></p><span>02</span><p><strong>Reserve with confidence</strong><small>Keep your medicine plans organized.</small></p></div>
      </div>
      <div className="auth-panel auth-form-panel">
        <p className="eyebrow">Create account</p>
        <h2>Start with MediFind</h2>
        <p className="auth-subtitle">A few details and you are ready to search.</p>
        {submitError && <div className="auth-error" role="alert">{submitError}</div>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField id="register-name" name="fullName" label="Full name" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="Your full name" autoComplete="name" />
          <FormField id="register-email" name="email" label="Email address" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" type="email" autoComplete="email" />
          <FormField id="register-phone" name="phone" label="Phone number" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+255 700 000 000" type="tel" autoComplete="tel" />
          <p className="auth-message">Patient registration only. Pharmacy staff accounts are created by an administrator.</p>
          <div className="auth-form-columns"><FormField id="register-password" name="password" label="Password" value={form.password} onChange={handleChange} error={errors.password} placeholder="At least 8 characters" type="password" autoComplete="new-password" /><FormField id="register-confirm-password" name="confirmPassword" label="Confirm password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Repeat password" type="password" autoComplete="new-password" /></div>
          <button className="button button-primary" type="submit">Create account <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login" state={{ from: location.state?.from }}>Log in</Link></p>
      </div>
    </section>
  )
}

function FormField({ id, name, label, value, onChange, error, type = 'text', placeholder, autoComplete }) {
  return <label htmlFor={id}>{label}<input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <span className="field-error" id={`${id}-error`}>{error}</span>}</label>
}

export default Register
