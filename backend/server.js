const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const hashPassword = (password) =>
  crypto.createHash("sha256").update(password).digest("hex");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  profileImage: user.profile_image || "",
  createdAt: user.created_at
});

const getItem = (id) => db.prepare(`
  SELECT i.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
         u.profile_image AS user_profile_image
  FROM items i
  JOIN users u ON u.id = i.user_id
  WHERE i.id = ?
`).get(id);

app.get("/", (req, res) => {
  res.json({ message: "LostLoop Backend is running!" });
});

app.get("/api/test-db", (req, res) => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  res.json({ success: true, message: "SQLite connected successfully!", tables });
});

// ---------------- AUTH ----------------
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({ message: "Please fill all details." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (exists) return res.status(409).json({ message: "Email already registered. Please login." });

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, phone.trim(), hashPassword(password));

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to create account.", error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get((email || "").trim().toLowerCase());
    if (!user || user.password !== hashPassword(password || "")) {
      return res.status(401).json({ message: "Invalid email or password. Please check your details or sign up." });
    }
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to login.", error: error.message });
  }
});

// ---------------- USERS ----------------
app.get("/api/users/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ success: true, user: publicUser(user) });
});

app.get("/api/users", (req, res) => {
  const exclude = Number(req.query.exclude || 0);
  const users = db.prepare("SELECT id, name, email, profile_image FROM users WHERE id <> ? ORDER BY name COLLATE NOCASE").all(exclude);
  res.json({ success: true, users });
});

app.put("/api/users/:id", (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    db.prepare(`UPDATE users SET name = ?, phone = ?, profile_image = ? WHERE id = ?`)
      .run((name || "").trim(), (phone || "").trim(), profileImage || "", req.params.id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
});

// ---------------- ITEMS ----------------
app.post("/api/items", (req, res) => {
  try {
    const { userId, itemName, category, description, type, date, location, image } = req.body;
    if (!userId || !itemName?.trim() || !category || !description?.trim() || !date || !location?.trim()) {
      return res.status(400).json({ message: "Please fill all required details." });
    }
    if (!["LOST", "FOUND"].includes(type)) return res.status(400).json({ message: "Invalid item type." });

    const owner = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!owner) return res.status(401).json({ message: "User not found. Please login again." });

    const result = db.prepare(`
      INSERT INTO items (user_id, item_name, category, description, type, date, location, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, itemName.trim(), category, description.trim(), type, date, location.trim(), image || "");

    const item = getItem(result.lastInsertRowid);
    // Keep the user's activity visible in Notifications immediately after a report is submitted.
    db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
      .run(userId, "REPORT", `Your ${type.toLowerCase()} report for ${item.item_name} was submitted successfully.`, item.id);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: "Unable to save item report.", error: error.message });
  }
});

app.get("/api/items", (req, res) => {
  try {
    const items = db.prepare(`
      SELECT i.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
             u.profile_image AS user_profile_image
      FROM items i JOIN users u ON u.id = i.user_id
      ORDER BY i.id DESC
    `).all();
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ message: "Unable to load items.", error: error.message });
  }
});

app.get("/api/items/user/:userId", (req, res) => {
  const items = db.prepare(`
    SELECT i.*, u.name AS user_name, u.email AS user_email
    FROM items i JOIN users u ON u.id = i.user_id
    WHERE i.user_id = ? ORDER BY i.id DESC
  `).all(req.params.userId);
  res.json({ success: true, items });
});

app.get("/api/items/:id", (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found." });
  res.json({ success: true, item });
});

app.put("/api/items/:id/status", (req, res) => {
  try {
    const allowed = ["ACTIVE", "CLAIMED", "REUNITED"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status." });
    const item = getItem(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    db.prepare("UPDATE items SET status = ? WHERE id = ?").run(req.body.status, req.params.id);

    if (req.body.status === "REUNITED") {
      // Manual "Mark Reunited" must also create activity, not only the claim-approval flow.
      db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
        .run(item.user_id, "REUNITED", `${item.item_name} was marked as reunited.`, item.id);

      // If a claimant already exists, notify them too and close their pending claim.
      const claimants = db.prepare("SELECT claimant_id FROM claims WHERE item_id = ? AND status = 'PENDING'").all(item.id);
      for (const c of claimants) {
        db.prepare("UPDATE claims SET status='APPROVED' WHERE item_id=? AND claimant_id=? AND status='PENDING'").run(item.id, c.claimant_id);
        db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
          .run(c.claimant_id, "REUNITED", `${item.item_name} was marked as reunited.`, item.id);
        db.prepare("INSERT INTO messages (sender_id, receiver_id, item_id, message) VALUES (?, ?, ?, ?)")
          .run(item.user_id, c.claimant_id, item.id, `The ${item.item_name} report has been marked as reunited.`);
      }
    }

    res.json({ success: true, item: getItem(req.params.id) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update item status.", error: error.message });
  }
});

app.get("/api/items/:id/matches", (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found." });
  const opposite = item.type === "LOST" ? "FOUND" : "LOST";
  const candidates = db.prepare(`
    SELECT i.*, u.name AS user_name, u.email AS user_email
    FROM items i JOIN users u ON u.id = i.user_id
    WHERE i.type = ? AND i.id <> ? AND i.status = 'ACTIVE'
  `).all(opposite, item.id);

  const normalize = (s) => (s || "").toLowerCase().trim();
  const tokens = (s) => normalize(s).split(/\s+/).filter(Boolean);
  const similarity = (a, b) => {
    const A = new Set(tokens(a)); const B = new Set(tokens(b));
    if (!A.size || !B.size) return 0;
    let common = 0; A.forEach(x => { if (B.has(x)) common++; });
    return common / Math.max(A.size, B.size);
  };

  const matches = candidates.map(candidate => {
    let score = 0;
    if (normalize(candidate.item_name) === normalize(item.item_name)) score += 3;
    else if (similarity(candidate.item_name, item.item_name) >= 0.5) score += 2;
    if (normalize(candidate.category) === normalize(item.category)) score += 2;
    if (normalize(candidate.location) === normalize(item.location)) score += 2;
    else if (similarity(candidate.location, item.location) >= 0.5) score += 1;
    return { ...candidate, match_score: score };
  }).filter(x => x.match_score >= 3).sort((a,b) => b.match_score - a.match_score);

  res.json({ success: true, matches });
});

// ---------------- SAVED ITEMS ----------------
app.get("/api/saved/:userId", (req, res) => {
  const items = db.prepare(`
    SELECT i.*, u.name AS user_name, u.email AS user_email
    FROM saved_items s JOIN items i ON i.id = s.item_id JOIN users u ON u.id = i.user_id
    WHERE s.user_id = ? ORDER BY s.id DESC
  `).all(req.params.userId);
  res.json({ success: true, items });
});

app.post("/api/saved", (req, res) => {
  try {
    db.prepare("INSERT OR IGNORE INTO saved_items (user_id, item_id) VALUES (?, ?)").run(req.body.userId, req.body.itemId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: "Unable to save item.", error: error.message });
  }
});

app.delete("/api/saved", (req, res) => {
  db.prepare("DELETE FROM saved_items WHERE user_id = ? AND item_id = ?").run(req.body.userId, req.body.itemId);
  res.json({ success: true });
});

// ---------------- MESSAGES ----------------
app.get("/api/messages/conversations/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const rows = db.prepare(`
    SELECT m.*, s.name AS sender_name, s.email AS sender_email,
           r.name AS receiver_name, r.email AS receiver_email,
           i.item_name
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    JOIN users r ON r.id = m.receiver_id
    LEFT JOIN items i ON i.id = m.item_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.id DESC
  `).all(userId, userId);

  const seen = new Set();
  const conversations = [];
  for (const row of rows) {
    const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    if (seen.has(otherId)) continue;
    seen.add(otherId);
    conversations.push({
      userId: otherId,
      name: row.sender_id === userId ? row.receiver_name : row.sender_name,
      email: row.sender_id === userId ? row.receiver_email : row.sender_email,
      preview: row.message,
      time: row.created_at,
      itemId: row.item_id,
      itemName: row.item_name || ""
    });
  }
  res.json({ success: true, conversations });
});

app.get("/api/messages/:userId/:otherUserId", (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, s.name AS sender_name, r.name AS receiver_name
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    JOIN users r ON r.id = m.receiver_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.id ASC
  `).all(req.params.userId, req.params.otherUserId, req.params.otherUserId, req.params.userId);
  res.json({ success: true, messages: rows });
});

app.post("/api/messages", (req, res) => {
  try {
    const { senderId, receiverId, itemId, message, attachment } = req.body;
    if (!senderId || !receiverId || (!message?.trim() && !attachment)) return res.status(400).json({ message: "Message cannot be empty." });
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, item_id, message, attachment) VALUES (?, ?, ?, ?, ?)
    `).run(senderId, receiverId, itemId || null, message.trim(), attachment || "");
    const row = db.prepare(`
      SELECT m.*, s.name AS sender_name, r.name AS receiver_name
      FROM messages m JOIN users s ON s.id=m.sender_id JOIN users r ON r.id=m.receiver_id
      WHERE m.id=?
    `).get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: row });
  } catch (error) {
    res.status(500).json({ message: "Unable to send message.", error: error.message });
  }
});

// ---------------- CLAIMS / REUNION ----------------
app.get("/api/claims/user/:userId", (req, res) => {
  const claims = db.prepare(`
    SELECT c.*, i.item_name, i.type, i.status AS item_status, i.user_id AS owner_id,
           owner.name AS owner_name, claimant.name AS claimant_name
    FROM claims c
    JOIN items i ON i.id=c.item_id
    JOIN users owner ON owner.id=i.user_id
    JOIN users claimant ON claimant.id=c.claimant_id
    WHERE c.claimant_id = ? OR i.user_id = ?
    ORDER BY c.id DESC
  `).all(req.params.userId, req.params.userId);
  res.json({ success: true, claims });
});

app.post("/api/claims", (req, res) => {
  try {
    const { itemId, claimantId, message } = req.body;
    const item = getItem(itemId);
    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.user_id === Number(claimantId)) return res.status(400).json({ message: "You cannot claim your own item." });
    const existing = db.prepare("SELECT id FROM claims WHERE item_id=? AND claimant_id=? AND status='PENDING'").get(itemId, claimantId);
    if (existing) return res.status(409).json({ message: "You already sent a claim for this item." });
    const result = db.prepare("INSERT INTO claims (item_id, claimant_id, message) VALUES (?, ?, ?)").run(itemId, claimantId, message || "I believe this item belongs to me.");
    db.prepare("INSERT INTO messages (sender_id, receiver_id, item_id, message) VALUES (?, ?, ?, ?)")
      .run(claimantId, item.user_id, itemId, message || "I believe this item belongs to me.");
    db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
      .run(item.user_id, "CLAIM", `${db.prepare("SELECT name FROM users WHERE id=?").get(claimantId).name} sent a claim for ${item.item_name}`, itemId);
    db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
      .run(claimantId, "CLAIM", `Your claim for ${item.item_name} is pending`, itemId);
    res.status(201).json({ success: true, claim: db.prepare("SELECT * FROM claims WHERE id=?").get(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ message: "Unable to create claim.", error: error.message });
  }
});

app.put("/api/claims/:id/status", (req, res) => {
  try {
    const status = req.body.status;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ message: "Invalid claim status." });
    const claim = db.prepare(`
      SELECT c.*, i.user_id AS owner_id, i.item_name, i.id AS item_id
      FROM claims c JOIN items i ON i.id=c.item_id WHERE c.id=?
    `).get(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found." });

    db.prepare("UPDATE claims SET status=? WHERE id=?").run(status, req.params.id);
    if (status === "APPROVED") {
      db.prepare("UPDATE items SET status='REUNITED' WHERE id=?").run(claim.item_id);
      db.prepare("UPDATE claims SET status='REJECTED' WHERE item_id=? AND id<>? AND status='PENDING'").run(claim.item_id, req.params.id);
      db.prepare("INSERT INTO messages (sender_id, receiver_id, item_id, message) VALUES (?, ?, ?, ?)")
        .run(claim.owner_id, claim.claimant_id, claim.item_id, `Your claim for ${claim.item_name} was approved. The item is marked as reunited.`);
      db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
        .run(claim.claimant_id, "REUNITED", `Your claim for ${claim.item_name} was approved. The item is reunited.`, claim.item_id);
      db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
        .run(claim.owner_id, "REUNITED", `${claim.item_name} was successfully reunited with the claimant.`, claim.item_id);
    } else {
      db.prepare("INSERT INTO notifications (user_id, type, text, item_id) VALUES (?, ?, ?, ?)")
        .run(claim.claimant_id, "CLAIM", `Your claim for ${claim.item_name} was rejected.`, claim.item_id);
    }
    res.json({ success: true, claim: db.prepare("SELECT * FROM claims WHERE id=?").get(req.params.id) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update claim.", error: error.message });
  }
});

// ---------------- NOTIFICATIONS ----------------
app.get("/api/notifications/:userId", (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const notifications = db.prepare(`
      SELECT n.id, n.type, n.text, n.item_id, n.created_at AS time
      FROM notifications n
      WHERE n.user_id=?
      ORDER BY n.id DESC LIMIT 50
    `).all(userId).map(n => ({
      ...n,
      icon: n.type === "REUNITED" ? "🟢" : n.type === "CLAIM" ? "🟣" : n.type === "REPORT" ? "📌" : "💬"
    }));

    // Backfill activity so notifications also work for records created before
    // notification inserts were added, or when an item was manually reunited.
    const existing = new Set(notifications.map(n => `${n.type}|${n.item_id}|${n.text}`));
    const add = (type, text, itemId, time, icon) => {
      const key = `${type}|${itemId}|${text}`;
      if (!existing.has(key)) {
        existing.add(key);
        notifications.push({ id: `${type}-${itemId}-${userId}-${time}`, type, text, item_id: itemId, time, icon });
      }
    };

    const reports = db.prepare(`
      SELECT id, item_name, type, status, created_at
      FROM items WHERE user_id=? ORDER BY id DESC LIMIT 30
    `).all(userId);
    for (const i of reports) {
      add("REPORT", `Your ${i.type.toLowerCase()} report for ${i.item_name} was submitted.`, i.id, i.created_at, "📌");
      if (i.status === "REUNITED") add("REUNITED", `${i.item_name} was marked as reunited.`, i.id, i.created_at, "🟢");
    }

    const claims = db.prepare(`
      SELECT c.id, c.item_id, c.status, c.created_at, i.item_name, i.user_id AS owner_id,
             claimant.name AS claimant_name
      FROM claims c JOIN items i ON i.id=c.item_id
      JOIN users claimant ON claimant.id=c.claimant_id
      WHERE c.claimant_id=? OR i.user_id=? ORDER BY c.id DESC LIMIT 50
    `).all(userId, userId);
    for (const c of claims) {
      if (userId === c.owner_id) {
        add("CLAIM", `${c.claimant_name} sent a claim for ${c.item_name}`, c.item_id, c.created_at, "🟣");
      } else {
        const type = c.status === "APPROVED" ? "REUNITED" : "CLAIM";
        const text = c.status === "APPROVED"
          ? `Your claim for ${c.item_name} was approved. The item is reunited.`
          : `Your claim for ${c.item_name} is ${c.status.toLowerCase()}`;
        add(type, text, c.item_id, c.created_at, type === "REUNITED" ? "🟢" : "🟣");
      }
    }

    const messages = db.prepare(`
      SELECT m.id, m.created_at AS time, m.item_id, s.name AS sender_name, m.message
      FROM messages m JOIN users s ON s.id=m.sender_id
      WHERE m.receiver_id=? ORDER BY m.id DESC LIMIT 50
    `).all(userId);
    for (const m of messages) {
      add("MESSAGE", `New message from ${m.sender_name}${m.item_id ? " about an item" : ""}`, m.item_id, m.time, "💬");
    }

    notifications.sort((a,b) => new Date(b.time) - new Date(a.time));
    res.json({ success: true, notifications: notifications.slice(0, 30) });
  } catch (error) {
    res.status(500).json({ message: "Unable to load notifications.", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`LostLoop backend running on http://localhost:${PORT}`);
});
