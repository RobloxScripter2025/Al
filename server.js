app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ error: "AI is currently disabled by admin." });
  }

  const { message } = req.body;
  if (!message) return res.json({ error: "No message provided" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // or llama3-8b-8192 if you want cheaper
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await r.json();

    if (data.error) {
      return res.json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply.";
    res.json({ reply });

  } catch (err) {
    res.json({ error: "Chat error: " + err.message });
  }
});
