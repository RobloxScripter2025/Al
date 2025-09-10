import express from "express";
import fetch from "node-fetch";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- Static frontend ---
app.use(express.static(path.join(__dirname, "public")));

// --- AI toggle ---
let aiEnabled = true;

// --- Chat API ---
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) return res.json({ reply: "⚠️ AI is disabled by admin." });

  const { message } = req.body;
  if (!message) return res.json({ reply: "⚠️ No message provided." });

  try {
    // Load chat history from cookie
    let messages = [];
    if (req.cookies.chatHistory) {
      try {
        messages = JSON.parse(req.cookies.chatHistory);
      } catch {
        messages = [];
      }
    }

    messages.push({ role: "user", content: message });

    // --- Groq API call ---
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // ✅ valid replacement model
        messages
      })
    });

    const data = await response.json();
    console.log("Groq raw response:", data);

    const reply = data?.choices?.[0]?.message?.content || "⚠️ No reply.";

    messages.push({ role: "assistant", content: reply });
    res.cookie("chatHistory", JSON.stringify(messages), { maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Server error: " + err.message });
  }
});

// --- Clear chat ---
app.post("/api/clear-chat", (req, res) => {
  res.clearCookie("chatHistory");
  res.json({ success: true });
});

// --- Admin login page ---
app.get("/admin/login", (req, res) => {
  res.send(`
    <h2>Admin Login</h2>
    <form method="POST" action="/admin/login">
      <input type="text" name="username" placeholder="Username" required /><br/>
      <input type="password" name="password" placeholder="Password" required /><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

// --- Admin login handler ---
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
    <h2>Admin Panel</h2>
    <p>AI is currently: <b>${aiEnabled ? "ENABLED" : "DISABLED"}</b></p>
    <form method="POST" action="/admin/toggle">
      <button type="submit">Toggle AI</button>
    </form>
    <form method="POST" action="/admin/logout">
      <button type="submit">Logout</button>
    </form>
  `);
});

// --- Toggle AI ---
app.post("/admin/toggle", (req, res) => {
  if (!req.session.loggedIn) return res.redirect("/admin/login");
  aiEnabled = !aiEnabled;
  res.redirect("/admin");
});

// --- Logout ---
app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
