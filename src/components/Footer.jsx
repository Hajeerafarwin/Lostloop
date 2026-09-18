import { Link } from "react-router-dom";
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand"><h2>♧ LostLoop</h2><p>Smart Lost & Found Network</p><p>Helping lost items find their way home.</p></div>
        <div className="footer-links"><h3>Quick Links</h3><Link to="/">Home</Link><a href="/#how-it-works">How It Works</a><a href="/#about">About</a></div>
        <div className="footer-links"><h3>Get Started</h3><Link to="/login">Login</Link><Link to="/signup">Sign Up</Link></div>
      </div>
      <div className="footer-bottom"><span>© 2026 LostLoop. All rights reserved.</span><span>Built to reconnect what matters.</span></div>
    </footer>
  );
}
export default Footer;
