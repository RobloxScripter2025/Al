import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY";
const GROQ_MODEL = "llama2-7b"; // Recommended active model

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== Routes =====

// Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: "Missing messages array" });

    const response = await fetch(`https://api.groq.com/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    const data = await response.json();
    // Groq returns an array of choices
    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "⚠️ Server error. Please try again." });
  }
});

// Admin login placeholder (you can expand)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
