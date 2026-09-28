import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'

const benefits = [
  ['✓', 'Verified pharmacies', 'Know where your medicine comes from.'],
  ['↻', 'Real-time stock updates', 'See when availability was last checked.'],
  ['TSh', 'Clear price information', 'Compare prices before you travel.'],
  ['⌖', 'Nearby pharmacies', 'Find convenient care around you.'],
]

const heroSlides = [
  { image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85', alt: 'Doctor speaking with a patient' },
  { image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1800&q=85', alt: 'Medicine capsules and tablets' },
  { image: 'https://images.unsplash.com/photo-1580281658223-9b93f18ae9ae?auto=format&fit=crop&w=1800&q=85', alt: 'Healthcare professional in a clinic' },
]

function Home() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 6000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <section className="hero-section">
        <div className="hero-slideshow" aria-hidden="true">
          {heroSlides.map((slide, index) => <div className={`hero-slide ${index === activeSlide ? 'is-active' : ''}`} key={slide.image} style={{ backgroundImage: `url(${slide.image})` }} />)}
        </div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Medicine access, made simpler</p>
            <h1>Find your medicine.<br /><span>Find it nearby.</span></h1>
            <p className="hero-text">Search verified pharmacies across Tanzania for medicine availability, prices and locations.</p>
            <SearchBar />
            <p className="search-note"><span aria-hidden="true">●</span> Trusted information from participating pharmacies</p>
          </div>
          <div className="hero-visual" aria-label="Illustration of a medicine search">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="medicine-bottle"><span>+</span><strong>MEDI<br />FIND</strong><small>care for all</small></div>
            <div className="floating-note note-top"><span>✓</span><div><strong>Verified stock</strong><small>Updated just now</small></div></div>
            <div className="floating-note note-bottom"><span>⌖</span><div><strong>Nearby options</strong><small>Across Tanzania</small></div></div>
          </div>
        </div>
        <div className="hero-slide-dots" aria-label="Hero image slides">{heroSlides.map((slide, index) => <button className={index === activeSlide ? 'is-active' : ''} type="button" key={slide.image} onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} />)}</div>
      </section>
      <section className="benefits-section">
        <div className="container benefits-grid">
          {benefits.map(([icon, title, description]) => <div className="benefit" key={title}><span className="benefit-icon">{icon}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-heading"><p className="eyebrow">Simple from start to finish</p><h2>Medicine access in three steps.</h2><p>Spend less time visiting pharmacies and more time getting the care you need.</p></div>
          <div className="steps-grid">
            {[['01', 'Search', 'Search for the medicine and strength you need.'], ['02', 'Compare', 'Compare availability, prices and pharmacies.'], ['03', 'Reserve', 'Reserve your medicine from an available pharmacy.']].map(([number, title, description]) => <div className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><Link to="/search">Start searching <span aria-hidden="true">↗</span></Link></div>)}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
