import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";
import { apiFetch, getLoggedInUser } from "../api";

function ItemDetails() {
  const navigate = useNavigate();
  const user = getLoggedInUser();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("message");
  const [claims, setClaims] = useState([]);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/items/${id}`);
      setItem(data.item);
      setMatches((await apiFetch(`/items/${id}/matches`)).matches || []);
      if (user?.id) {
        const savedItems = await apiFetch(`/saved/${user.id}`);
        setSaved((savedItems.items || []).some(x => x.id === data.item.id));
        const claimData = await apiFetch(`/claims/user/${user.id}`);
        setClaims((claimData.claims || []).filter(x => x.item_id === data.item.id));
      }
    } catch (e) {
      alert(e.message);
    }
  }, [user?.id]);

  useEffect(() => {
    const id = localStorage.getItem("selectedItemId");
    if (id) load(id);
  }, [load]);

  const sendMessage = async () => {
    if (!message.trim()) return alert("Please enter a message.");
    try {
      await apiFetch("/messages", { method: "POST", body: JSON.stringify({ senderId: user.id, receiverId: item.user_id, itemId: item.id, message }) });
      setMessage(""); setShow(false); alert("Message sent successfully!"); navigate("/messages");
    } catch (e) { alert(e.message); }
  };

  const claim = async () => {
    if (!message.trim()) return alert("Please enter a message.");
    try {
      await apiFetch("/claims", { method: "POST", body: JSON.stringify({ itemId: item.id, claimantId: user.id, message }) });
      setMessage(""); setShow(false); alert("Claim sent successfully!"); await load(item.id);
    } catch (e) { alert(e.message); }
  };

  const updateClaim = async (id, status) => {
    try {
      await apiFetch(`/claims/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      alert(status === "APPROVED" ? "Claim approved and item marked as reunited." : "Claim rejected.");
      await load(item.id);
    } catch (e) { alert(e.message); }
  };

  const markReunited = async () => {
    try {
      await apiFetch(`/items/${item.id}/status`, { method: "PUT", body: JSON.stringify({ status: "REUNITED" }) });
      alert("Item marked as reunited!");
      await load(item.id);
    } catch (e) { alert(e.message); }
  };

  const save = async () => {
    try {
      if (saved) {
        await apiFetch("/saved", { method: "DELETE", body: JSON.stringify({ userId: user.id, itemId: item.id }) });
        setSaved(false);
      } else {
        await apiFetch("/saved", { method: "POST", body: JSON.stringify({ userId: user.id, itemId: item.id }) });
        setSaved(true);
      }
    } catch (e) { alert(e.message); }
  };

  if (!item) return <InternalLayout title="Item Details" subtitle=""><div className="empty-card">Loading item...</div></InternalLayout>;

  const isOwner = user?.id === item.user_id;
  const myClaim = claims.find(c => c.claimant_id === user?.id);
  const statusClass = item.status === "REUNITED" ? "pill-reunited" : item.type === "LOST" ? "pill-lost" : "pill-found";

  return (
    <InternalLayout title="Item Details" subtitle="View complete information about this report.">
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-image-large">{item.image ? <img src={item.image} alt={item.item_name} /> : item.type === "LOST" ? "🔍" : "🤝"}</div>
        </div>
        <div className="detail-info">
          <div className="detail-status-row"><span className={statusClass}>{item.status === "REUNITED" ? "REUNITED" : item.type}</span>{item.status === "REUNITED" && <strong className="reunited-note">✓ Successfully reunited</strong>}</div>
          <h2>{item.item_name}</h2>
          <p className="detail-category">{item.category}</p>
          <div className="detail-facts"><div><small>{item.type === "LOST" ? "Date Lost" : "Date Found"}</small><b>{item.date}</b></div><div><small>Location</small><b>{item.location}</b></div></div>
          <h3>Description</h3><p>{item.description}</p>
          <p className="posted">Posted by <b>{item.user_name}</b></p>
          <div className="detail-actions">
            {!isOwner && item.status !== "REUNITED" && <button className="primary-btn" onClick={() => { setMode(item.type === "FOUND" ? "claim" : "message"); setShow(true); }}>✉ {item.type === "FOUND" ? "Claim Item" : "Contact Finder"}</button>}
            {isOwner && item.type === "FOUND" && item.status !== "REUNITED" && <button className="primary-btn" onClick={() => setShow(true)}>📩 View Claims</button>}
            {isOwner && item.status !== "REUNITED" && <button className="secondary-btn" onClick={markReunited}>✓ Mark Reunited</button>}
            {!isOwner && item.status !== "REUNITED" && <button className="secondary-btn" onClick={save}>{saved ? "♥ Saved" : "♡ Save"}</button>}
          </div>
          {myClaim && <div className={`claim-status claim-${myClaim.status.toLowerCase()}`}><b>Your claim: {myClaim.status}</b><span>{myClaim.status === "PENDING" ? "Waiting for the finder to review your claim." : myClaim.status === "APPROVED" ? "The item has been marked as reunited." : "The claim was rejected."}</span></div>}
        </div>
      </div>

      <section className="matches-inline">
        <div className="section-heading left"><p className="section-label">POSSIBLE MATCHES</p><h2>Matches for this report</h2></div>
        {matches.length ? <div className="match-list">{matches.map(x => <div className="match-row" key={x.id}><span>{x.type === "LOST" ? "🔍" : "🤝"}</span><div><b>{x.item_name}</b><small>{x.category} · {x.location}</small></div><strong>{Math.min(99, x.match_score * 20)}% match</strong><button onClick={() => { localStorage.setItem("selectedItemId", String(x.id)); navigate("/item-details"); }}>View Match</button></div>)}</div> : <div className="empty-card compact">No possible match yet.</div>}
      </section>

      {show && <div className="modal-backdrop"><div className="contact-modal">
        <button className="modal-close" onClick={() => setShow(false)}>×</button>
        {isOwner && item.type === "FOUND" ? <>
          <h2>Claims for {item.item_name}</h2>
          {claims.length ? claims.map(c => <div className="claim-row" key={c.id}><b>{c.claimant_name}</b><p>{c.message}</p><small>Status: {c.status}</small>{c.status === "PENDING" && <div className="form-actions"><button className="secondary-btn" onClick={() => updateClaim(c.id, "REJECTED")}>Reject</button><button className="primary-btn" onClick={() => updateClaim(c.id, "APPROVED")}>Approve & Reunite</button></div>}</div>) : <p>No claims yet.</p>}
        </> : <>
          <h2>{mode === "claim" ? "Claim Item" : "Contact Finder"}</h2>
          <p>{mode === "claim" ? "Tell the owner why you believe this item belongs to you." : "Send a message to start the reunion process."}</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={mode === "claim" ? "Explain identifying details..." : "Write your message..."} />
          <div className="form-actions"><button className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn" onClick={mode === "claim" ? claim : sendMessage}>{mode === "claim" ? "Send Claim" : "Send Message"}</button></div>
        </>}
      </div></div>}
    </InternalLayout>
  );
}
export default ItemDetails;
