import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html")); // ✅ correct name
});

// Example toggle route
let aiEnabled = true;
app.post("/api/admin/toggle", (req, res) => {
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});

// Chat endpoint (checks if AI is enabled)
app.post("/api/chat", async (req, res) => {
  if (!aiEnabled) {
    return res.json({ reply: "⚠️ AI is currently disabled by admin." });
  }
  // ... your GROQ chat logic here ...
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
