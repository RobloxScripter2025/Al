async function send() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const msg = input.value;
  input.value = "";

  chat.innerHTML += `<div class="msg user">You: ${msg}</div>`;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: msg }] })
  });
  const data = await res.json();

  if (data.choices && data.choices[0].message) {
    const reply = data.choices[0].message.content;
    chat.innerHTML += `<div class="msg bot">AI: ${reply}</div>`;
  } else {
    chat.innerHTML += `<div class="msg bot">AI: Error getting response</div>`;
  }

  chat.scrollTop = chat.scrollHeight;
}
