const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");
const clearBtn = document.getElementById("clear-chat");

// Load chat history from cookie
function getChatHistory() {
  const match = document.cookie.match(/(^|;)\\s*chatHistory=([^;]+)/);
  if (match) return JSON.parse(decodeURIComponent(match[2]));
  return [];
}

// Display chat
function displayChat() {
  chatBox.innerHTML = "";
  const messages = getChatHistory();
  messages.forEach(m => {
    const div = document.createElement("div");
    div.textContent = `${m.role === "user" ? "You" : "AI"}: ${m.content}`;
    div.style.margin = "0.5rem 0";
    chatBox.appendChild(div);
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  chatInput.value = "";
  displayChat();
});

clearBtn.addEventListener("click", async () => {
  await fetch("/api/clear-chat", { method: "POST" });
  displayChat();
});

displayChat();
