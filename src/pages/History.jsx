import { useEffect,useState } from "react";
import InternalLayout from "../components/InternalLayout";
import { apiFetch,getLoggedInUser } from "../api";
function History(){const [items,setItems]=useState([]);const load=async()=>{const u=getLoggedInUser();if(!u)return;try{setItems((await apiFetch(`/items/user/${u.id}`)).items);}catch(e){alert(e.message);}};useEffect(()=>{load();},[]);return <InternalLayout title="My Reports" subtitle="View and manage your reported items."><div className="history-summary"><strong>{items.length}</strong><span>Total Reports</span></div>{items.length?<div className="history-list">{items.map(x=><div className="history-row" key={x.id}><span className={x.type==="LOST"?"pill-lost":"pill-found"}>{x.type}</span><div><h3>{x.item_name}</h3><p>{x.category} · 📍 {x.location}</p></div><small>{x.date}</small><b>{x.status}</b></div>)}</div>:<div className="empty-card">No reports yet.</div>}</InternalLayout>}
export default History;
