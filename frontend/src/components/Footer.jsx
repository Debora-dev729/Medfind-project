import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">M</span>
            <span>MediFind <em>Tanzania</em></span>
          </Link>
          <p>Helping people discover medicine availability and pharmacies across Tanzania.</p>
        </div>
        <div className="footer-links">
          <strong>Quick Links</strong>
          <Link to="/">Home</Link>
          <Link to="/search">Find Medicine</Link>
          <Link to="/search">Pharmacies</Link>
          <Link to="/#about">About</Link>
        </div>
        <div className="footer-links">
          <strong>Your Account</strong>
          <Link to="/login">Log in</Link>
          <Link to="/register">Register as Patient</Link>
          <div className="footer-contact footer-contact-nested">
            <strong>Contact</strong>
            <span>Email: Not published</span>
            <span>Phone: Not published</span>
          </div>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 MediFind Tanzania. All rights reserved.</span><span>Availability is shared by participating pharmacies and may change.</span></div>
    </footer>
  )
}

export default Footer
