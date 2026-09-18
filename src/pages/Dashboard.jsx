import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";
import { apiFetch, getLoggedInUser } from "../api";

function Dashboard(){
 const [user,setUser]=useState(getLoggedInUser()); const [items,setItems]=useState([]); const [saved,setSaved]=useState(0);
 const load=async()=>{try{const u=getLoggedInUser(); if(!u)return; const [a,b]=await Promise.all([apiFetch(`/items/user/${u.id}`),apiFetch(`/saved/${u.id}`)]);setItems(a.items);setSaved(b.items.length);}catch(e){console.error(e);}};
 useEffect(()=>{load();},[]);
 const lost=items.filter(x=>x.type==="LOST").length, found=items.filter(x=>x.type==="FOUND").length, reunited=items.filter(x=>x.status==="REUNITED").length;
 return <InternalLayout title="" subtitle=""><div className="dashboard-welcome"><div><h1>Welcome back, {user?.name||"User"}!</h1><p>Let's help reunite more lost items today.</p></div><Link to="/profile" className="edit-profile-link">Edit Profile</Link></div><div className="dashboard-top-grid"><Link to="/report-lost" className="dash-action"><span>▣</span><h3>Report Lost Item</h3><p>Lost something?<br/>Let others help you find it.</p></Link><Link to="/found-item" className="dash-action"><span>♧</span><h3>Report Found Item</h3><p>Found something?<br/>Help someone get it back.</p></Link><div className="recent-panel"><h3>Recent Activity</h3>{items.slice(0,4).map(x=><div className="activity-mini" key={x.id}><span>{x.type==="LOST"?"🔍":"🤝"}</span><div><b>{x.type==="LOST"?"New lost report":"New item found"}</b><small>{x.item_name}</small></div><em>{x.type}</em></div>)}{!items.length&&<p className="muted">No activity yet.</p>}</div></div><div className="dash-stats"><div><strong>{lost}</strong><span>My Lost Reports</span></div><div><strong>{found}</strong><span>Found Reports</span></div><div><strong>{reunited}</strong><span>Items Reunited</span></div><div><strong>{saved}</strong><span>Saved Items</span></div></div><div className="dashboard-quick"><Link to="/browse">⌕ Browse Items <small>Find reported items</small></Link><Link to="/matches">◎ Possible Matches <small>Review possible matches</small></Link><Link to="/messages">✉ Messages <small>Contact owners and finders</small></Link><Link to="/notifications">● Notifications <small>See recent activity</small></Link></div></InternalLayout>;
}
export default Dashboard;
