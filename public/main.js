// --- Cookie helpers ---
function setCookie(name, value, days = 7) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
  const cname = name + "=";
  const decoded = decodeURIComponent(document.cookie);
  const ca = decoded.split(';');
  for (let c of ca) {
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
  }
  return "";
}

// --- Chat logic ---
const chat = document.getElementById("chat");
let messages = [];

// Restore from cookies
window.onload = () => {
  const saved = getCookie("chatHistory");
  if (saved) {
    messages = JSON.parse(saved);
    messages.forEach(m => renderMessage(m.role, m.content));
  }
};

function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "bot");
  div.innerText = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const input = document.getElementById("input");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";

  // Render & store user message
  renderMessage("user", msg);
  messages.push({ role: "user", content: msg });
  setCookie("chatHistory", JSON.stringify(messages));

  // Call backend
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });
  const data = await res.json();

  let reply = "Error";
  if (data.choices && data.choices[0].message) {
    reply = data.choices[0].message.content;
  }

  // Render & store bot reply
  renderMessage("assistant", reply);
  messages.push({ role: "assistant", content: reply });
  setCookie("chatHistory", JSON.stringify(messages));
}
