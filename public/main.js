const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatWindow = document.getElementById("chat-window");

// Load chat history from cookies
let chatHistory = [];
const saved = document.cookie.split("; ").find(row => row.startsWith("chatHistory="));
if (saved) {
  try {
    chatHistory = JSON.parse(decodeURIComponent(saved.split("=")[1]));
    chatHistory.forEach(msg => appendMessage(msg.role, msg.content));
  } catch {}
}

function appendMessage(role, content) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = `${role === "user" ? "You" : "AI"}: ${content}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function saveHistory() {
  document.cookie = `chatHistory=${encodeURIComponent(JSON.stringify(chatHistory))}; path=/; max-age=604800`;
}

// Handle chat form submission
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  appendMessage("user", message);
  chatHistory.push({ role: "user", content: message });
  chatInput.value = "";
  saveHistory();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are OGMSAI, a helpful assistant." },
          ...chatHistory
        ]
      })
    });

    const data = await res.json();
    const reply = data.reply || "⚠️ No reply";
    appendMessage("assistant", reply);
    chatHistory.push({ role: "assistant", content: reply });
    saveHistory();

  } catch (err) {
    appendMessage("assistant", "⚠️ Server error. Please try again.");
  }
};
