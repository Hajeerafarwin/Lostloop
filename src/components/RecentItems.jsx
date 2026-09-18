import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function RecentItems() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    apiFetch("/items").then(data => setItems((data.items || []).slice(0, 6))).catch(() => setItems([]));
  }, []);
  const view = (item) => {
    if (!localStorage.getItem("loggedInUser")) return navigate("/login");
    localStorage.setItem("selectedItemId", String(item.id));
    navigate("/item-details");
  };
  return <section id="recent" className="recent-section"><div className="section-heading left"><p className="section-label">RECENT ITEMS</p><h2>Recently Reported</h2><p>See the latest lost and found reports.</p></div>{items.length === 0 ? <div className="empty-home">No recent reports yet.</div> : <div className="home-item-grid">{items.map(item => <div className="home-item-card" key={item.id}><div className="item-card-top"><span>{item.type === "LOST" ? "🔍" : "🤝"}</span><b className={item.type === "LOST" ? "lost" : "found"}>{item.type}</b></div>{item.image && <div className="home-item-image"><img src={item.image} alt={item.item_name} /></div>}<h3>{item.item_name}</h3><p>{item.category}</p><small>📍 {item.location}</small><button onClick={() => view(item)}>View Details</button></div>)}</div>}</section>;
}
export default RecentItems;
