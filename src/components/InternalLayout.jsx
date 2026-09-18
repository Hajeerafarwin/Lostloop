import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

function InternalLayout({ title, subtitle, children }) {
  const [user, setUser] = useState(null);
  useEffect(() => { setUser(JSON.parse(localStorage.getItem("loggedInUser") || "null")); }, []);
  return (
    <div className="internal-shell">
      <Sidebar />
      <main className="internal-main">
        <header className="internal-header">
          <form className="internal-search" onSubmit={(e)=>{e.preventDefault(); const q=e.currentTarget.elements.search.value.trim(); if(q) window.location.href=`/browse?search=${encodeURIComponent(q)}`;}}><span>⌕</span><input name="search" placeholder="Search for items, locations..." /></form>
          <div className="internal-user">
            <Link to="/notifications" className="bell">♧</Link>
            <Link to="/profile" className="user-chip">
              <span className="avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : (user?.name || "U").charAt(0).toUpperCase()}</span>
              <span>{user?.name || "User"}</span><small>⌄</small>
            </Link>
          </div>
        </header>
        <section className="internal-content">
          <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div></div>
          {children}
        </section>
      </main>
    </div>
  );
}
export default InternalLayout;
