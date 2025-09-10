const messagesDiv = document.getElementById("messages");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat");
const chatList = document.getElementById("chat-list");

let chatHistory = [];
let chatSessions = [];
let currentChatIndex = -1;

function startNewChat() {
  chatHistory = [];
  messagesDiv.innerHTML = "";
  currentChatIndex = chatSessions.length;
  chatSessions.push([]);
  renderChatList();
}

function renderChatList() {
  chatList.innerHTML = "";
  chatSessions.forEach((session, i) => {
    const li = document.createElement("li");
    li.textContent = session[0]?.content.slice(0, 15) || "New Chat";
    li.onclick = () => loadChat(i);
    chatList.appendChild(li);
  });
}

function loadChat(index) {
  currentChatIndex = index;
  chatHistory = chatSessions[index] || [];
  messagesDiv.innerHTML = "";
  chatHistory.forEach(msg =>
    addMessage(msg.role === "user" ? "You" : "AI", msg.content, msg.role)
  );
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("You", message, "user");
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    addMessage("AI", data.reply, "ai");
  } catch (err) {
    addMessage("AI", "⚠️ Error: Could not connect to server.", "ai");
  }
}

function addMessage(sender, text, role) {
  const msg = document.createElement("div");
  msg.classList.add("message", role);
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  chatHistory.push({ role, content: text });
  if (currentChatIndex >= 0) {
    chatSessions[currentChatIndex] = chatHistory;
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
newChatBtn.addEventListener("click", startNewChat);

