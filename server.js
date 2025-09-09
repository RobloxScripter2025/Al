import express from "express";
import fetch from "node-fetch";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.static("public"));

// === In-memory admin state ===
let aiEnabled = true;

// === Chat endpoint ===
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ error: "AI is currently disabled by admin." });
  }

  const { message } = req.body;
  try {
    // Example call to Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No reply.";
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to connect to AI." });
  }
});

// === Admin login page ===
app.get("/admin", (req, res) => {
  res.sendFile(path.resolve("public/admin.html"));
});

// === Admin login check ===
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// === Admin toggle AI ===
app.post("/api/admin/toggle", (req, res) => {
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

// === Start server ===
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
