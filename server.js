import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let aiEnabled = true;

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "super-secret-key", // change this
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set secure: true if using https
  })
);

// ----------- STATIC FILES -----------
app.use(express.static(path.join(__dirname, "public")));

// ----------- CHAT ENDPOINT -----------
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) return res.json({ reply: "⚠️ AI is disabled by admin." });

  const { message } = req.body;
  if (!message) return res.json({ reply: "⚠️ No message provided." });

  try {
    // Load chat history safely
    let messages = [];
    if (req.cookies.chatHistory) {
      try {
        const parsed = JSON.parse(req.cookies.chatHistory);
        if (Array.isArray(parsed)) messages = parsed;
      } catch {
        messages = [];
      }
    }

    messages.push({ role: "user", content: message });

    // Call Groq API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
        }),
      }
    );

    const data = await response.json();
    console.log("Groq raw response:", data);

    const reply = data?.choices?.[0]?.message?.content || "⚠️ No reply.";

    messages.push({ role: "assistant", content: reply });

    // Save back to cookies
    res.cookie("chatHistory", JSON.stringify(messages), {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Server error: " + err.message });
  }
});

// ----------- CLEAR CHAT ENDPOINT -----------
app.post("/api/clear-chat", (req, res) => {
  res.clearCookie("chatHistory");
  res.json({ success: true });
});

// ----------- ADMIN PANEL -----------
app.get("/admin", (req, res) => {
  if (!req.session.loggedIn) {
    return res.sendFile(path.join(__dirname, "public", "admin-login.html"));
  }
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

app.post("/api/toggle-ai", (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

// ----------- START SERVER -----------
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
