import express from "express";
import fetch from "node-fetch";
import path from "path";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// AI toggle (default ON)
let aiEnabled = true;

// === Admin routes ===

// Serve admin panel page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

// Admin login
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    res.cookie("adminAuth", "1", { httpOnly: true });
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// Admin logout
app.post("/api/admin-logout", (req, res) => {
  res.clearCookie("adminAuth");
  res.json({ success: true });
});

// Toggle AI on/off
app.post("/api/admin-toggle", (req, res) => {
  if (req.cookies.adminAuth !== "1") {
    return res.status(403).json({ success: false });
  }
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

// === Chat route ===
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) return res.json({ reply: "⚠️ AI is disabled by admin." });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ reply: "⚠️ Invalid messages payload." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // ✅ supported Groq model
        messages: messages
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Groq API Error:", data.error);
      return res.json({ reply: `⚠️ Error: ${data.error.message}` });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply";
    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ reply: "⚠️ Server error: " + err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
