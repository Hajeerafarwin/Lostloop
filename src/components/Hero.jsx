import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroIllustration from "../assets/hero-illustration.svg";

function Hero() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const doSearch = () => {
    if (!localStorage.getItem("loggedInUser")) {
      navigate("/login");
      return;
    }
    localStorage.setItem("browseSearch", search);
    navigate("/browse");
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-kicker">SMART LOST & FOUND NETWORK</p>
          <h1>Lost something?<br />Found something?</h1>
          <h2>Let LostLoop connect<br />the pieces.</h2>
          <p>Report, discover and reunite lost items<br />with their owners — anywhere, anytime.</p>
          <div className="hero-search">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for lost or found items..." />
            <button onClick={doSearch}>⌕ Search</button>
          </div>
        </div>
        <div className="hero-visual">
          <img className="hero-illustration-image" src={heroIllustration} alt="LostLoop lost and found illustration" />
        </div>
      </div>
    </section>
  );
}
export default Hero;
