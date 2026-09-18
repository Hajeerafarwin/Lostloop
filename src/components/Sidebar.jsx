import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const links = [
    ["/dashboard","⌂","Dashboard"],
    ["/report-lost","＋","Report Lost Item"],
    ["/report-found","＋","Report Found Item"],
    ["/browse","⌕","Browse Items"],
    ["/history","▣","My Reports"],
    ["/matches","◎","Matches"],
    ["/messages","✉","Messages"],
    ["/notifications","●","Notifications"],
    ["/profile","◉","Profile"],
    ["/settings","⚙","Settings"]
  ];
  const logout = () => { localStorage.removeItem("loggedInUser"); navigate("/"); };
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="side-brand"><span>♧</span> LostLoop</NavLink>
      <div className="side-links">
        {links.map(([to,icon,label]) => <NavLink key={to} to={to} className="side-link"><span>{icon}</span>{label}</NavLink>)}
      </div>
      <button className="side-logout" onClick={logout}>↪ <span>Logout</span></button>
    </aside>
  );
}
export default Sidebar;
