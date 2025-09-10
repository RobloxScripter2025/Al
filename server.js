app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Braxton" && password === "OGMSAdmin") {
    // set session or a simple cookie flag
    res.cookie("adminAuth", "1", { httpOnly: true });
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/api/admin-logout", (req, res) => {
  res.clearCookie("adminAuth");
  res.json({ success: true });
});

app.post("/api/admin-toggle", (req, res) => {
  const auth = req.cookies.adminAuth === "1";
  if (!auth) return res.status(403).json({ success: false });
  aiEnabled = req.body.enabled;
  res.json({ success: true, aiEnabled });
});
