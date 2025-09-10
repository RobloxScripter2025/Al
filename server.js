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
const GROQ_MODEL = "llama2-7b"; // Use an active Groq model

if (!GROQ_API_KEY) {
  console.error("⚠️ GROQ_API_KEY is not set in environment variables.");
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== Chat API =====
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) {
      console.error("Received empty messages array:", req.body);
      return res.status(400).json({ error: "Missing messages array" });
    }

    const response = await fetch("https://api.groq.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Groq API did not return a valid response:", data);
      return res.status(500).json({ reply: "⚠️ Invalid response from Groq API" });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ reply: "⚠️ Server error. Check console for details." });
  }
});

// ===== Admin page placeholder =====
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== Catch-all error handler =====
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).send("⚠️ Internal Server Error. Check server console.");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ===== Global unhandled exception logging =====
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});
