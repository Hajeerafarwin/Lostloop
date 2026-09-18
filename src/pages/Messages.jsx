import { useCallback, useEffect, useRef, useState } from "react";
import InternalLayout from "../components/InternalLayout";
import { apiFetch, getLoggedInUser } from "../api";

function Messages() {
  const user = getLoggedInUser();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState([]);
  const fileRef = useRef(null);

  const load = useCallback(async (keepSelection = true) => {
    if (!user) return;
    try {
      const data = await apiFetch(`/messages/conversations/${user.id}`);
      const list = data.conversations || [];
      setConversations(list);
      let current = keepSelection ? list.find(c => c.userId === selected?.userId) : null;
      if (!current && !selected && list[0]) current = list[0];
      if (current) {
        setSelected(current);
        const chat = await apiFetch(`/messages/${user.id}/${current.userId}`);
        setMessages(chat.messages || []);
      }
    } catch (e) { console.error(e); }
  }, [selected, user]);

  useEffect(() => { load(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setInterval(() => load(true), 3000);
    return () => clearInterval(timer);
  }, [load]);

  const openNewMessage = async () => {
    try {
      const data = await apiFetch(`/users?exclude=${user.id}`);
      setUsers(data.users || []);
      setShowNew(true);
    } catch (e) { alert(e.message); }
  };

  const chooseNewUser = (u) => {
    const conversation = { userId: u.id, name: u.name, email: u.email, preview: "New conversation", time: new Date().toISOString(), itemId: null };
    setSelected(conversation);
    setMessages([]);
    setShowNew(false);
  };

  const choose = async (conversation) => {
    setSelected(conversation);
    const data = await apiFetch(`/messages/${user.id}/${conversation.userId}`);
    setMessages(data.messages || []);
  };

  const chooseFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Please select an image below 5 MB.");
    const reader = new FileReader();
    reader.onload = () => setAttachment(reader.result);
    reader.readAsDataURL(file);
  };

  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !attachment) || !selected) return;
    try {
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: selected.userId, itemId: selected.itemId, message: text.trim() || "Image attachment", attachment })
      });
      setText(""); setAttachment("");
      if (fileRef.current) fileRef.current.value = "";
      const chat = await apiFetch(`/messages/${user.id}/${selected.userId}`);
      setMessages(chat.messages || []);
      await load(true);
    } catch (e) { alert(e.message); }
  };

  return (
    <InternalLayout title="Messages" subtitle="Chat with users about your reports.">
      <div className="messages-layout">
        <div className="conversation-list">
          <div className="conversation-list-title">
            <strong>Conversations</strong>
            <div className="conversation-tools"><span>{conversations.length}</span><button type="button" className="new-message-btn" title="New message" onClick={openNewMessage}>+</button></div>
          </div>
          {conversations.length ? conversations.map(c => (
            <button type="button" className={selected?.userId === c.userId ? "conversation active" : "conversation"} key={c.userId} onClick={() => choose(c)}>
              <span className="avatar">{c.name?.charAt(0) || "U"}</span>
              <span className="conversation-details"><strong>{c.name}</strong><small>{c.preview}</small></span>
              <time>{new Date(c.time).toLocaleDateString()}</time>
            </button>
          )) : <div className="empty-chat"><div>💬</div><h3>No conversations yet</h3><p>Contact a finder or owner from an item details page.</p><button type="button" className="primary-btn start-message-btn" onClick={openNewMessage}>+ New Message</button></div>}
        </div>
        <div className="chat-panel">
          {selected ? <>
            <div className="chat-head"><span className="avatar">{selected.name?.charAt(0) || "U"}</span><div><strong>{selected.name}</strong><small>{selected.email}</small></div></div>
            <div className="chat-body">
              {messages.length ? messages.map(m => <div key={m.id} className={`message-row ${m.sender_id === user.id ? "sent" : "received"}`}>
                <div className={`bubble ${m.sender_id === user.id ? "sent" : "received"}`}>
                  {m.attachment && <img className="message-attachment" src={m.attachment} alt="Attachment" />}
                  {m.message && m.message !== "Image attachment" && <div>{m.message}</div>}
                  <small>{new Date(m.created_at).toLocaleString()}</small>
                </div>
              </div>) : <div className="empty-chat"><div>💬</div><h3>Start a conversation</h3><p>Send a message or attach an image below.</p></div>}
            </div>
            {attachment && <div className="attachment-preview"><img src={attachment} alt="Attachment preview"/><span>Image attached</span><button type="button" onClick={() => {setAttachment(""); if(fileRef.current) fileRef.current.value = "";}}>×</button></div>}
            <form className="chat-input" onSubmit={send}>
              <button type="button" className="attach-btn" title="Attach image" onClick={() => fileRef.current?.click()}>+</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={chooseFile} hidden />
              <input value={text} onChange={e => setText(e.target.value)} placeholder={`Message ${selected.name}...`} />
              <button type="submit" disabled={!text.trim() && !attachment}>➤</button>
            </form>
          </> : <div className="empty-chat"><div>💬</div><h3>Select a conversation</h3><p>Use the <b>+</b> button to start a new message.</p></div>}
        </div>
      </div>
      {showNew && <div className="modal-backdrop"><div className="contact-modal new-message-modal">
        <button className="modal-close" onClick={() => setShowNew(false)}>×</button>
        <h2>New Message</h2><p>Select a user to start chatting.</p>
        <div className="new-user-list">{users.length ? users.map(u => <button type="button" key={u.id} onClick={() => chooseNewUser(u)}><span className="avatar">{u.name?.charAt(0) || "U"}</span><span><b>{u.name}</b><small>{u.email}</small></span></button>) : <p>No other users registered yet.</p>}</div>
      </div></div>}
    </InternalLayout>
  );
}
export default Messages;
