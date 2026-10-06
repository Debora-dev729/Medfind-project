import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../services/authService'
import './Auth.css'

function ChangePassword() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.newPassword.length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const result = await changePassword(form)
      updateUser(result)
      navigate('/pharmacy/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to change the password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel auth-intro">
        <p className="eyebrow"><span /> Pharmacy staff setup</p>
        <h1>Choose your password to continue.</h1>
        <p>Your temporary password has been used to sign in. Set a private password for your account.</p>
      </div>
      <div className="auth-panel auth-form-panel">
        <p className="eyebrow">{user?.fullName}</p>
        <h2>Change temporary password</h2>
        <p className="auth-subtitle">Your new password must contain at least 8 characters.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="current-password">Temporary password<input id="current-password" name="currentPassword" type="password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} autoComplete="current-password" required /></label>
          <label htmlFor="new-password">New password<input id="new-password" name="newPassword" type="password" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} autoComplete="new-password" minLength="8" required /></label>
          <label htmlFor="confirm-password">Confirm new password<input id="confirm-password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength="8" required /></label>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Updating...' : 'Change password'}</button>
        </form>
        <button className="button button-secondary" type="button" onClick={logout}>Log out</button>
      </div>
    </section>
  )
}

export default ChangePassword