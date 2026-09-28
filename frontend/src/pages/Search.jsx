import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import PharmacyCard from '../components/PharmacyCard'
import Loading from '../components/Loading'
import { searchMedicines } from '../services/medicineService'

const getDistanceInKilometres = (from, to) => {
  if (!to) return Number.POSITIVE_INFINITY
  const earthRadius = 6371
  const latitudeDelta = (to.latitude - from.latitude) * Math.PI / 180
  const longitudeDelta = (to.longitude - from.longitude) * Math.PI / 180
  const latitudeOne = from.latitude * Math.PI / 180
  const latitudeTwo = to.latitude * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [locationState, setLocationState] = useState('idle')
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    searchMedicines(query).then((data) => {
      if (active) setResults(data)
    }).catch(() => {
      if (active) setError(true)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [query])

  const pharmacyResults = results.flatMap((medicine) => medicine.availability.map(({ pharmacy, availability }) => ({ medicine, pharmacy, availability })))
  const sortedPharmacyResults = [...pharmacyResults].sort((first, second) => {
    if (!userLocation) return first.pharmacy.distance - second.pharmacy.distance
    return getDistanceInKilometres(userLocation, first.pharmacy.coordinates) - getDistanceInKilometres(userLocation, second.pharmacy.coordinates)
  })

  const findNearbyPharmacies = () => {
    if (!navigator.geolocation) {
      setLocationState('unsupported')
      return
    }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setLocationState('ready')
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }

  return (
    <div className="page-section search-page">
      <div className="container">
        <div className="search-page-header"><div><p className="eyebrow">Search medicine</p><h1>Find what you need, nearby.</h1><p>Compare verified pharmacies and choose an option that works for you.</p></div><SearchBar initialQuery={query} compact /></div>
        {loading ? <Loading label="Loading medicine directory" /> : error ? <div className="message-state"><h2>Something went wrong.</h2><p>Please try again in a moment.</p></div> : !query ? (
          <>
            <div className="results-heading"><div><p className="eyebrow">Medicine directory</p><h2>Search medicines and find them nearby.</h2></div><span className="results-query">{results.length} medicines listed</span></div>
            <div className="medicine-directory">{results.map((medicine) => <article className="medicine-directory-card" key={medicine.id}><div className="medicine-directory-heading"><div className="medicine-symbol small">+</div><div><h3>{medicine.name} <span>{medicine.strength}</span></h3><p>{medicine.form} · {medicine.description}</p></div></div><div className="directory-locations"><strong>Available at</strong>{medicine.availability.map(({ pharmacy }) => <Link to={`/pharmacies/${pharmacy.id}`} key={pharmacy.id}><span aria-hidden="true">⌖</span>{pharmacy.name}, {pharmacy.city}</Link>)}</div><Link className="directory-action" to={`/medicines/${medicine.id}`}>Compare prices and reserve <span aria-hidden="true">→</span></Link></article>)}</div>
          </>
        ) : (
          <>
            <div className="results-heading"><div><p className="eyebrow">Availability across Tanzania</p><h2>{sortedPharmacyResults.length} pharmacies found</h2></div><div className="results-tools"><span className="results-query">Results for “{query}”</span><button className="button button-secondary nearby-button" type="button" onClick={findNearbyPharmacies} disabled={locationState === 'loading'}><span aria-hidden="true">⌖</span>{locationState === 'loading' ? 'Finding you...' : 'Find near me'}</button></div></div>
            {locationState === 'ready' && <p className="location-message" role="status">Sorted by distance from your current location.</p>}
            {locationState === 'denied' && <p className="location-message location-message-error" role="status">Location access was denied. Showing pharmacies by their listed distance.</p>}
            {locationState === 'unsupported' && <p className="location-message location-message-error" role="status">Your browser does not support location access. Showing pharmacies by their listed distance.</p>}
              {sortedPharmacyResults.length ? <div className="results-list">{sortedPharmacyResults.map(({ medicine, pharmacy, availability }) => <PharmacyCard key={`${medicine.id}-${pharmacy.id}`} pharmacy={pharmacy} availability={availability} medicineId={medicine.id} />)}</div> : <div className="message-state"><h2>No pharmacies found.</h2><p>Try searching for another medicine or strength.</p></div>}
          </>
        )}
      </div>
    </div>
  )
}

export default Search
