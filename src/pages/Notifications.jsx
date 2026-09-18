import { useCallback, useEffect, useState } from "react";
import InternalLayout from "../components/InternalLayout";
import { apiFetch, getLoggedInUser } from "../api";

function Notifications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const user = getLoggedInUser();
    if (!user) return;
    try {
      const data = await apiFetch(`/notifications/${user.id}`);
      setList(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <InternalLayout title="Notifications" subtitle="Stay updated with recent activity.">
      <div className="notification-toolbar"><span>Recent activity</span><button type="button" onClick={load}>↻ Refresh</button></div>
      <div className="notification-list">
        {loading ? <div className="empty-card">Loading notifications...</div> : list.length ? list.map((n, i) => (
          <div className="notification" key={`${n.time}-${i}`}>
            <span>{n.icon}</span>
            <div><b>{n.text}</b><small>{new Date(n.time).toLocaleString()}</small></div>
            <i>•</i>
          </div>
        )) : <div className="empty-card">🔔<h3>No notifications yet</h3><p>Your new activity will appear here.</p></div>}
      </div>
    </InternalLayout>
  );
}
export default Notifications;
