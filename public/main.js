const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");
const fileInput = document.getElementById("file-input");

// ===== Load chats from cookies =====
let chats = {};
const saved = document.cookie.split("; ").find(row => row.startsWith("chats="));
if (saved) {
  try {
    chats = JSON.parse(decodeURIComponent(saved.split("=")[1]));
  } catch {}
}

// ===== Initialize current chat =====
let currentChat = null;

if (Object.keys(chats).length === 0) {
  createNewChat();
} else {
  currentChat = Object.keys(chats)[0];
  updateSidebar();
  renderChat();
}

// ===== Functions =====

function updateSidebar() {
  chatList.innerHTML = "";
  Object.keys(chats).forEach(id => {
    const li = document.createElement("li");
    li.textContent = id;
    li.className = id === currentChat ? "active" : "";
    li.onclick = () => switchChat(id);
    chatList.appendChild(li);
  });
}

function saveChats() {
  document.cookie = `chats=${encodeURIComponent(JSON.stringify(chats))}; path=/; max-age=604800`;
}

function createNewChat() {
  const id = `Chat ${Object.keys(chats).length + 1}`;
  chats[id] = [];
  currentChat = id;
  updateSidebar();
  renderChat();
  saveChats();
  return id;
}

function switchChat(id) {
  currentChat = id;
  updateSidebar();
  renderChat();
}

function renderChat() {
  chatWindow.innerHTML = "";
  for (const msg of chats[currentChat]) {
    appendMessage(msg.role, msg.content);
  }
}

function appendMessage(role, content) {
  const div = document.createElement("div");
  div.className = role === "user" ? "user-msg" : "ai-msg";
  div.textContent = content;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ===== Event Handlers =====

// Chat submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message && !fileInput.files.length) return;

  // File upload display
  if (fileInput.files.length > 0) {
    const fileName = fileInput.files[0].name;
    appendMessage("user", `[File Uploaded: ${fileName}]`);
    chats[currentChat].push({ role: "user", content: `[File Uploaded: ${fileName}]` });
    fileInput.value = "";
  }

  if (message) {
    appendMessage("user", message);
    chats[currentChat].push({ role: "user", content: message });
    chatInput.value = "";
  }

  saveChats();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are OGMSAI, a helpful assistant." },
          ...chats[currentChat]
        ]
      })
    });

    const data = await res.json();
    const reply = data.reply || "⚠️ No reply";
    appendMessage("assistant", reply);
    chats[currentChat].push({ role: "assistant", content: reply });
    saveChats();
  } catch (err) {
    appendMessage("assistant", "⚠️ Server error. Please try again.");
  }
});

// New chat button
newChatBtn.onclick = createNewChat;
