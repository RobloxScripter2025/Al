import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GROQ_API_KEY;

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages
      })
    });

    const data = await response.json();

    // Groq may return 'completion' or 'choices[0].message.content'
    let reply = "";
    if (data.reply) reply = data.reply;
    else if (data.completion) reply = data.completion;
    else if (data.choices && data.choices[0]?.message?.content)
      reply = data.choices[0].message.content;
    else reply = "Error: no AI response";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Groq API error" });
  }
});

app.listen(process.env.PORT || 10000, () => console.log("✅ Server running"));
