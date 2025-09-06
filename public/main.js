const chatWindow = document.getElementById("chat");
const input = document.getElementById("input");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");

let sessions = {};
let currentSession = null;

// --- Load sessions from localStorage ---
function loadSessions() {
  const saved = localStorage.getItem("chatSessions");
  if (saved) sessions = JSON.parse(saved);
  currentSession = Object.keys(sessions)[0] || createNewSession();
  renderSidebar();
}

// --- Save sessions ---
function saveSessions() {
  localStorage.setItem("chatSessions", JSON.stringify(sessions));
}

// --- Create a new session ---
function createNewSession() {
  const key = `session-${Date.now()}`;
  sessions[key] = [];
  currentSession = key;
  saveSessions();
  renderSidebar();
  renderChat();
  return key;
}

// --- Switch session ---
function switchSession(key) {
  currentSession = key;
  renderChat();
  renderSidebar();
}

// --- Render sidebar ---
function renderSidebar() {
  chatList.innerHTML = "";
  for (const key of Object.keys(sessions)) {
    const li = document.createElement("li");
    li.innerText = key; // optionally give it a nicer title
    li.className = key === currentSession ? "active" : "";
    li.onclick = () => switchSession(key);
    chatList.appendChild(li);
  }
}

// --- Render chat window ---
function renderChat() {
  chatWindow.innerHTML = "";
  if (!currentSession) return;
  sessions[currentSession].forEach(msg => {
    const div = document.createElement("div");
    div.className = "msg " + (msg.role === "user" ? "user" : "bot");
    div.innerText = msg.content;
    chatWindow.appendChild(div);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Send message ---
async function send() {
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";

  // Add user message
  sessions[currentSession].push({ role: "user", content: msg });
  renderChat();
  saveSessions();

  // Call backend
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: sessions[currentSession] })
    });
    const data = await res.json();
    let reply = "Error: no response";
    if (data.choices && data.choices[0].message) reply = data.choices[0].message.content;

    sessions[currentSession].push({ role: "assistant", content: reply });
    renderChat();
    saveSessions();
  } catch (err) {
    console.error(err);
    sessions[currentSession].push({ role: "assistant", content: "Error contacting AI" });
    renderChat();
    saveSessions();
  }
}

// --- New Chat button ---
newChatBtn.onclick = createNewSession;

// --- Initialize ---
window.onload = loadSessions;
