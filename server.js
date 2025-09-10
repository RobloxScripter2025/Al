import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Groq settings =====
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama2-7b"; // Update to a supported model

if (!GROQ_API_KEY) {
  console.error("⚠️ GROQ_API_KEY is not set in environment variables!");
}

// ===== Middleware =====
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== Chat API =====
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages payload:", req.body);
      return res.status(400).json({ reply: "⚠️ Invalid messages payload" });
    }

    console.log("Sending messages to Groq API:", messages);

    const response = await fetch("https://api.groq.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }),
    });

    const data = await response.json();
    console.log("Groq API raw response:", JSON.stringify(data, null, 2));

    let reply = "⚠️ No reply";

    // Extract reply safely
    if (data?.choices && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data?.error) {
      console.error("Groq API returned error:", data.error);
      reply = "⚠️ Groq API error. Check console.";
    } else {
      console.error("Unexpected Groq API response:", data);
      reply = "⚠️ Unexpected Groq API response. Check console.";
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chat API exception:", err);
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

// ===== Global error handlers =====
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).send("⚠️ Internal Server Error. Check server console.");
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
