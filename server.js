import express from "express";
import fetch from "node-fetch";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// --- ESM dirname fix ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Session for admin ---
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- Serve static files ---
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// --- In-memory AI toggle ---
let aiEnabled = true;

// --- Chat endpoint with cookie memory ---
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) return res.json({ error: "AI is currently disabled." });

  const { message } = req.body;
  if (!message) return res.json({ error: "No message provided." });

  try {
    // Get previous chat from cookie
    let messages = [];
    if (req.cookies.chatHistory) {
      messages = JSON.parse(req.cookies.chatHistory);
    }

    messages.push({ role: "user", content: message });

    // Call Groq AI
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply.";

    messages.push({ role: "assistant", content: reply });

    // Save chat in cookie (1 week)
    res.cookie("chatHistory", JSON.stringify(messages), { maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// --- Clear chat ---
app.post("/api/clear-chat", (req, res) => {
  res.clearCookie("chatHistory");
  res.json({ success: true });
});

// --- Placeholder image generation ---
app.post("/api/generate-image", async (req, res) => {
  if (!aiEnabled) return res.json({ error: "AI is currently disabled." });
  const { prompt } = req.body;
  if (!prompt) return res.json({ error: "No prompt provided." });

  res.json({ url: "https://via.placeholder.com/512?text=Image+placeholder" });
});

// --- Admin routes ---
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    req.session.loggedIn = true;
    return res.redirect("/admin");
  }
  res.send("<p>Invalid login. <a href='/admin/login'>Try again</a></p>");
});

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

app.post("/admin/toggle", (req, res) => {
  if (req.session.loggedIn) aiEnabled = !aiEnabled;
  res.redirect("/admin");
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
