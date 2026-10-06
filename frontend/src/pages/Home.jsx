import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import './Home.css'

const services = [
  ['⌕', 'Find medicines', 'Search for medicines and check their availability.'],
  ['⌖', 'Locate pharmacies', 'Discover pharmacies where your medicine is listed.'],
  ['◷', 'Check availability', 'See availability information before you visit.'],
  ['＋', 'Reserve medicine', 'Reserve available medicine through participating pharmacies.'],
]

const steps = [
  ['01', 'Search', 'Search for the medicine you need.'],
  ['02', 'Compare', 'View pharmacies where it is available.'],
  ['03', 'Choose', 'Select a convenient pharmacy.'],
  ['04', 'Reserve', 'Reserve medicine when the pharmacy offers it.'],
]

const trustPoints = [
  ['Easier medicine discovery', 'Search one place to find medicines listed by participating pharmacies.'],
  ['Better pharmacy visibility', 'Help people discover local pharmacies and the stock they share.'],
  ['Availability from pharmacies', 'Availability details reflect information provided by pharmacies and may change.'],
  ['Convenient reservations', 'Reserve listed medicine ahead when reservation is available.'],
]

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-eyebrow"><span /> A clearer way to find medicine</p>
            <h1>Find your medicine.<br /><span>Find a pharmacy near you.</span></h1>
            <p className="home-lede">MediFind helps you quickly discover pharmacies with the medicines you need.</p>
            <div className="home-hero-actions">
              <Link className="home-button home-button-primary" to="/search">Find Medicine <span aria-hidden="true">→</span></Link>
              <Link className="home-button home-button-secondary" to="/search">Find Pharmacies <span aria-hidden="true">↘</span></Link>
            </div>
            <p className="home-hero-caption"><span aria-hidden="true">✳</span> Discover participating pharmacies across Tanzania</p>
          </div>
          <div className="home-network-visual" role="img" aria-label="Illustration of pharmacy discovery through MediFind">
            <div className="home-map-grid" aria-hidden="true">
              <span className="home-map-road home-map-road-one" />
              <span className="home-map-road home-map-road-two" />
              <span className="home-map-road home-map-road-three" />
              <span className="home-map-route" />
              <span className="home-map-node home-map-node-one">+</span>
              <span className="home-map-node home-map-node-two">+</span>
              <span className="home-map-node home-map-node-three">+</span>
              <span className="home-map-pin"><span>⌖</span></span>
            </div>
            <div className="home-discovery-card"><span className="home-discovery-kicker">MEDIFIND · TANZANIA</span><strong>Pharmacy discovery, made simpler.</strong><span>Search local medicine availability.</span><Link to="/search">Explore medicine search <b aria-hidden="true">↗</b></Link></div>
          </div>
        </div>
      </section>

      <section className="home-search-band" aria-labelledby="home-search-title">
        <div className="container home-search-layout">
          <div><p className="home-eyebrow">Medicine finder</p><h2 id="home-search-title">What are you looking for?</h2></div>
          <SearchBar placeholder="Search for a medicine..." buttonLabel="Search Medicine" />
        </div>
      </section>

      <section className="home-services">
        <div className="container">
          <div className="home-section-heading">
            <p className="home-eyebrow">One platform, more possibilities</p>
            <h2>Make your next pharmacy visit more informed.</h2>
            <p>Find information shared by pharmacies, then choose the next step that works for you.</p>
          </div>
          <div className="home-service-grid">{services.map(([icon, title, description], index) => <article className="home-service" key={title}><span className="home-service-number">0{index + 1}</span><span className="home-service-icon" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="home-process" id="how-it-works">
        <div className="container home-process-layout">
          <div className="home-section-heading">
            <p className="home-eyebrow">How MediFind helps</p>
            <h2>Four clear steps to a pharmacy option.</h2>
            <p>Move from a medicine search to a convenient next step, all in one place.</p>
          </div>
          <ol className="home-step-list">{steps.map(([number, title, description]) => <li key={number}><span className="home-step-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span className="home-step-arrow" aria-hidden="true">↗</span></li>)}</ol>
        </div>
      </section>

      <section className="home-trust" id="about">
        <div className="container home-trust-layout">
          <div className="home-section-heading"><p className="home-eyebrow">Built around access</p><h2>Making medicine discovery easier across Tanzania.</h2><p>MediFind connects people with pharmacy availability information, so they can make a more informed choice before they travel.</p></div>
          <div className="home-trust-list">{trustPoints.map(([title, description]) => <div className="home-trust-point" key={title}><span aria-hidden="true">✓</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="container home-final-cta-inner">
          <div><p className="home-eyebrow">A better place to start</p><h2>Find the medicine you need, faster.</h2><p>Search MediFind and discover pharmacies near you.</p></div>
          <Link className="home-button home-button-light" to="/search">Find Medicine <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  )
}

export default Home
