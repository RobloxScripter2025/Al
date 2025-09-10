import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let aiEnabled = true; // default ON

// ✅ Serve admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ✅ Admin toggle route
app.post("/api/admin/toggle", (req, res) => {
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

// ✅ Chat route
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ reply: "⚠️ AI is currently disabled by admin." });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // 🔑 put your Groq key in Render environment vars
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // ✅ replace with supported model
        messages: [
          { role: "system", content: "You are OGMSAI, a helpful assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await groqRes.json();

    if (data.error) {
      console.error("Groq API Error:", data.error);
      return res.json({ reply: `⚠️ Error: ${data.error.message}` });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply.";
    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ reply: "⚠️ Server error, please try again later." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
