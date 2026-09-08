import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SearchBar({ initialQuery = '', compact = false }) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) navigate(`/search?query=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <form className={`search-form ${compact ? 'search-form-compact' : ''}`} onSubmit={handleSubmit} role="search">
      <label className="sr-only" htmlFor="medicine-search">Search for a medicine</label>
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input id="medicine-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicine e.g. Paracetamol 500mg" autoComplete="off" />
      <button className="button button-primary" type="submit">Search <span aria-hidden="true">→</span></button>
    </form>
  )
}

export default SearchBar
