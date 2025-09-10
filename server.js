import express from "express";
import fetch from "node-fetch";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname fix for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session middleware ---
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // false for HTTP/Render dev
}));

// --- Serve frontend files ---
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- AI toggle ---
let aiEnabled = true;

// --- Chat endpoint ---
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) return res.json({ error: "AI is currently disabled." });
  const { message } = req.body;
  if (!message) return res.json({ error: "No message provided." });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: message }]
      })
    });
    const data = await response.json();
    if (data.error) return res.json({ error: data.error.message });

    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply.";
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// --- Image generation placeholder ---
app.post("/api/generate-image", async (req, res) => {
  if (!aiEnabled) return res.json({ error: "AI is currently disabled." });
  const { prompt } = req.body;
  if (!prompt) return res.json({ error: "No prompt provided." });

  res.json({ url: "https://via.placeholder.com/512?text=Image+placeholder" });
});

// --- Admin login page ---
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// --- Admin login POST ---
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    req.session.loggedIn = true;
    return res.redirect("/admin");
  }
  res.send("<p>Invalid login. <a href='/admin/login'>Try again</a></p>");
});

// --- Admin panel ---
app.get("/admin", (req, res) => {
  if (!req.session.loggedIn) return res.redirect("/admin/login");

  res.send(`
    <h1>Admin Panel</h1>
    <p>AI Status: <b>${aiEnabled ? "ENABLED ✅" : "DISABLED ❌"}</b></p>
    <form method="POST" action="/admin/toggle">
      <button type="submit">${aiEnabled ? "Disable" : "Enable"} AI</button>
    </form>
    <br/>
    <a href="/admin/logout">Logout</a>
  `);
});

// --- Toggle AI ---
app.post("/admin/toggle", (req, res) => {
  if (req.session.loggedIn) aiEnabled = !aiEnabled;
  res.redirect("/admin");
});

// --- Logout ---
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
