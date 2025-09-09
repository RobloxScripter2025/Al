let sessions = {};
let currentSessionId = null;

// === DOM elements ===
const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const chatListEl = document.getElementById("chatList");
const fileUploadEl = document.getElementById("fileUpload");

// === Start with one session ===
newSession();

// --- Helpers ---
function newSession() {
  const id = Date.now().toString();
  sessions[id] = [];
  currentSessionId = id;
  renderSidebar();
  renderChat();
}

function switchSession(id) {
  currentSessionId = id;
  renderSidebar();
  renderChat();
  if (typeof hideSidebarOnMobile === "function") hideSidebarOnMobile();
}

function renderSidebar() {
  chatListEl.innerHTML = "";
  Object.keys(sessions).forEach((id) => {
    const li = document.createElement("li");
    li.textContent = "Chat " + id;
    if (id === currentSessionId) li.classList.add("active");
    li.onclick = () => switchSession(id);
    chatListEl.appendChild(li);
  });
}

function renderChat() {
  chatEl.innerHTML = "";
  sessions[currentSessionId].forEach((msg) => addMessage(msg.role, msg.content, false));
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addMessage(role, content, save = true) {
  const div = document.createElement("div");
  div.classList.add("msg", role);
  if (role === "file") {
    div.classList.add("file");
    div.textContent = `📎 File: ${content}`;
  } else if (role === "image") {
    const img = document.createElement("img");
    img.src = content;
    img.alt = "Generated image";
    img.style.maxWidth = "300px";
    img.style.borderRadius = "8px";
    div.appendChild(img);
  } else {
    div.textContent = content;
  }
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  if (save) sessions[currentSessionId].push({ role, content });
}

// --- Sending text ---
async function send() {
  const message = inputEl.value.trim();
  if (!message) return;
  inputEl.value = "";

  addMessage("user", message);

  // detect image request
  const wantsImage = /generate (an )?image|draw|picture|photo/i.test(message);

  if (wantsImage) {
    addMessage("bot", "🖼️ Generating image...");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message })
      });
      const data = await res.json();
      if (data.error) {
        addMessage("bot", "⚠️ " + data.error);
      } else if (data.url) {
        addMessage("image", data.url);
      } else {
        addMessage("bot", "⚠️ Image generation failed.");
      }
    } catch {
      addMessage("bot", "⚠️ Error generating image.");
    }
    return;
  }

  // otherwise normal AI chat
  addMessage("bot", "⏳ Thinking...");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    chatEl.lastChild.remove(); // remove "⏳ Thinking..."
    if (data.error) {
      addMessage("bot", "⚠️ " + data.error);
    } else {
      addMessage("bot", data.reply || "⚠️ No reply.");
    }
  } catch {
    chatEl.lastChild.remove();
    addMessage("bot", "⚠️ Failed to reach server.");
  }
}

// --- File uploads ---
fileUploadEl.addEventListener("change", () => {
  const file = fileUploadEl.files[0];
  if (file) {
    addMessage("file", file.name);
    // If you want to actually upload:
    // const formData = new FormData();
    // formData.append("file", file);
    // fetch("/api/upload", { method:"POST", body: formData });
  }
});

// --- Bind events ---
document.getElementById("newChatBtn").onclick = newSession;
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
