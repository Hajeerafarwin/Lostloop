import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand"><span className="brand-mark">♧</span> LostLoop</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="/#how-it-works">How It Works</a>
        <a href="/#about">About</a>
      </div>
      <div className="nav-buttons">
        <Link to="/login" className="login-btn">Login</Link>
        <Link to="/signup" className="signup-btn">Sign Up</Link>
      </div>
    </nav>
  );
}
export default Navbar;
