const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");

let currentChatId = Date.now().toString();

// --- Cookie helpers ---
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days = 7) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

// --- Chat history handling ---
function getChatHistory() {
  const cookie = getCookie("chatHistory");
  if (cookie) return JSON.parse(cookie);
  return {};
}

function saveChatHistory(history) {
  setCookie("chatHistory", JSON.stringify(history));
}

function displayChat() {
  const history = getChatHistory();
  const messages = history[currentChatId] || [];
  chatBox.innerHTML = "";
  messages.forEach(m => {
    const div = document.createElement("div");
    div.textContent = `${m.role === "user" ? "You" : "AI"}: ${m.content}`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateSidebar() {
  const history = getChatHistory();
  chatList.innerHTML = "";
  Object.keys(history).forEach(id => {
    const li = document.createElement("li");
    li.textContent = "Chat " + id;
    li.style.cursor = "pointer";
    li.onclick = () => {
      currentChatId = id;
      displayChat();
    };
    chatList.appendChild(li);
  });
}

// --- Event handlers ---
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message to history
  let history = getChatHistory();
  if (!history[currentChatId]) history[currentChatId] = [];
  history[currentChatId].push({ role: "user", content: message });
  saveChatHistory(history);
  displayChat();

  // Send to server
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    const reply = data.reply || "⚠️ No reply.";

    // Add AI reply
    history = getChatHistory();
    history[currentChatId].push({ role: "assistant", content: reply });
    saveChatHistory(history);
    displayChat();
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }

  chatInput.value = "";
});

newChatBtn.addEventListener("click", () => {
  currentChatId = Date.now().toString();
  const history = getChatHistory();
  history[currentChatId] = [];
  saveChatHistory(history);
  displayChat();
  updateSidebar();
});

// --- Initialize ---
displayChat();
updateSidebar();
