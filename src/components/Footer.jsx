import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer" id="about">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">M</span>
            <span>MediFind <em>Tanzania</em></span>
          </Link>
          <p>Helping people find available medicine from verified pharmacies across Tanzania.</p>
        </div>
        <div className="footer-links">
          <strong>Explore</strong>
          <Link to="/search">Search medicine</Link>
          <a href="#how-it-works">How it works</a>
        </div>
        <div className="footer-contact">
          <strong>Built for better access</strong>
          <p>Availability information is provided by participating pharmacies and may change.</p>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 MediFind Tanzania</span><span>Healthcare, made easier to find.</span></div>
    </footer>
  )
}

export default Footer
