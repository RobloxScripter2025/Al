const chatWindow = document.getElementById("chat");
const input = document.getElementById("input");
const sessionListDiv = document.getElementById("sessionList");
const sidebar = document.getElementById("sidebar");

let sessions = {};          // All chat sessions
let currentSession = null;  // Current session key

// --- Initialize ---
window.onload = () => {
  loadSessions();
  if (!currentSession) promptNewChat(); // ask for first chat name if none
  renderSidebar();
  renderChat();
};

// --- LocalStorage helpers ---
function saveSessions() {
  localStorage.setItem("chatSessions", JSON.stringify(sessions));
}

function loadSessions() {
  const saved = localStorage.getItem("chatSessions");
  if (saved) {
    sessions = JSON.parse(saved);
    currentSession = Object.keys(sessions)[0];
  }
}

// --- Sidebar toggle ---
function toggleSidebar() {
  sidebar.classList.toggle("hidden");
}

// --- Session management ---
function promptNewChat() {
  const name = prompt("Enter chat name:", "New Chat");
  if (!name) return;

  const key = `session-${Date.now()}`;
  sessions[key] = { name, messages: [] };
  currentSession = key;
  saveSessions();
  renderSidebar();
  renderChat();
}

function switchSession(key) {
  currentSession = key;
  renderSidebar();
  renderChat();
}

// --- Render sidebar ---
function renderSidebar() {
  sessionListDiv.innerHTML = "";
  Object.keys(sessions).forEach(key => {
    const btn = document.createElement("div");
    btn.className = "session-item" + (key === currentSession ? " active" : "");
    btn.innerText = sessions[key].name;
    btn.onclick = () => switchSession(key);
    sessionListDiv.appendChild(btn);
  });
}

// --- Chat rendering ---
function renderChat() {
  chatWindow.innerHTML = "";
  if (!currentSession || !sessions[currentSession]) return;

  sessions[currentSession].messages.forEach(msg => {
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
  sessions[currentSession].messages.push({ role: "user", content: msg });
  renderChat();
  saveSessions();

  // Call backend Groq API
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: sessions[currentSession].messages })
    });

    const data = await res.json();
    const reply = data.reply || "Error: no response"; // Groq response key

    // Add AI message
    sessions[currentSession].messages.push({ role: "assistant", content: reply });
    renderChat();
    saveSessions();
  } catch (err) {
    console.error(err);
    sessions[currentSession].messages.push({ role: "assistant", content: "Error contacting AI" });
    renderChat();
    saveSessions();
  }
}
