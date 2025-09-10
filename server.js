import express from "express";
import path from "path";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

let aiEnabled = true; // default ON

// === Chat API ===
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ reply: "⚠️ The AI has been disabled by admin." });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "⚠️ No response" });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Server error: " + err.message });
  }
});

// === Admin Login ===
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    res.cookie("adminAuth", "1", { httpOnly: true });
    return res.json({ success: true });
  }
  res.json({ success: false });
});

app.post("/api/admin-logout", (req, res) => {
  res.clearCookie("adminAuth");
  res.json({ success: true });
});

app.post("/api/admin-toggle", (req, res) => {
  if (req.cookies.adminAuth !== "1") {
    return res.status(403).json({ success: false });
  }
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
