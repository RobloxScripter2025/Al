import express from "express";
import fetch from "node-fetch";
import session from "express-session";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Simple session (in-memory, fine for small Render project) ---
app.use(session({
  secret: "supersecretkey", // change if you want
  resave: false,
  saveUninitialized: true
}));

// --- AI Toggle State ---
let aiEnabled = true;

// --- Chat Endpoint (Groq) ---
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ error: "AI is currently disabled by admin." });
  }
  
  const { message } = req.body;
  if (!message) return res.json({ error: "No message provided" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await r.json();
    if (data.error) {
      return res.json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply.";
    res.json({ reply });

  } catch (err) {
    res.json({ error: "Chat error: " + err.message });
  }
});

// --- Admin Login Page ---
app.get("/admin/login", (req, res) => {
  res.send(`
    <h2>Admin Login</h2>
    <form method="POST" action="/admin/login">
      <input type="text" name="username" placeholder="Username" /><br/>
      <input type="password" name="password" placeholder="Password" /><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Handle Admin Login ---
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    req.session.loggedIn = true;
    return res.redirect("/admin");
  }
  res.send("<p>Invalid login. <a href='/admin/login'>Try again</a></p>");
});

// --- Admin Panel (Protected) ---
app.get("/admin", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/admin/login");
  }

  res.send(`
    <h1>Admin Panel</h1>
    <p>AI is currently: <b>${aiEnabled ? "ENABLED ✅" : "DISABLED ❌"}</b></p>
    <form method="POST" action="/admin/toggle">
      <button type="submit">${aiEnabled ? "Disable AI" : "Enable AI"}</button>
    </form>
    <br/>
    <a href="/admin/logout">Logout</a>
  `);
});

// --- Toggle AI ---
app.post("/admin/toggle", (req, res) => {
  if (req.session.loggedIn) {
    aiEnabled = !aiEnabled;
  }
  res.redirect("/admin");
});

// --- Logout ---
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
