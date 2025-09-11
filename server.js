import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "gemma-7b"; // Replace with available model

if (!GROQ_API_KEY) console.error("⚠️ GROQ_API_KEY is not set!");

// ===== Middleware =====
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== AI Toggle =====
let aiEnabled = true;

// ===== Chat API =====
app.post("/api/chat", async (req, res) => {
  try {
    if (!aiEnabled) return res.json({ reply: "⚠️ AI is currently disabled by admin." });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages payload:", req.body);
      return res.status(400).json({ reply: "⚠️ Invalid messages payload" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }),
    });

    const data = await response.json();
    console.log("Groq API raw response:", JSON.stringify(data, null, 2));

    let reply = "⚠️ No reply";
    if (data?.choices && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data?.error) {
      console.error("Groq API returned error:", data.error);
      reply = `⚠️ Groq API error: ${data.error.message}`;
    } else {
      console.error("Unexpected Groq API response:", data);
    }

    res.json({ reply });

  } catch (err) {
    console.error("Chat API exception:", err);
    res.status(500).json({ reply: "⚠️ Server error. Check console." });
  }
});

// ===== Admin Login Page =====
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// ===== Admin Login Handler =====
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === "Braxton" && password === "OGMSAdmin") {
    // Redirect to toggle page
    res.redirect("/admin-panel");
  } else {
    res.send("⚠️ Invalid credentials.");
  }
});

// ===== Admin Panel (Toggle AI) =====
app.get("/admin-panel", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Admin Panel</title>
      </head>
      <body>
        <h1>Admin Panel</h1>
        <p>AI is currently: <strong>${aiEnabled ? "Enabled" : "Disabled"}</strong></p>
        <form method="POST" action="/toggle-ai">
          <button type="submit">${aiEnabled ? "Disable AI" : "Enable AI"}</button>
        </form>
      </body>
    </html>
  `);
});

app.post("/toggle-ai", (req, res) => {
  aiEnabled = !aiEnabled;
  res.redirect("/admin-panel");
});

// ===== Serve homepage =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== Global error handlers =====
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).send("⚠️ Internal Server Error. Check console.");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
