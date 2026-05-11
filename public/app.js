import { micromark } from 'https://esm.sh/micromark@3?bundle';

const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("promptInput");
const sendButton = document.getElementById("sendButton");
const testButton = document.getElementById("testButton");
const chatMessages = document.getElementById("chatMessages");
const sourcesList = document.getElementById("sourcesList");

function addMessage(text, sender = "bot", extraClass = "", toolsUsed = []) {
    const message = document.createElement("div");
    message.className = `message ${sender} ${extraClass}`.trim();

    const content = document.createElement("div");
    content.className = "message-content";

    if (sender === "bot") {
        content.innerHTML = micromark(text);
    } else {
        content.textContent = text;
    }

    message.appendChild(content);

    if (sender === "bot" && toolsUsed.length > 0) {
        const tools = document.createElement("div");
        tools.className = "tools-used";
        tools.textContent = `Tools used: ${toolsUsed.join(", ")}`;
        message.appendChild(tools);
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}
function clearSources() {
    sourcesList.innerHTML = `<p class="empty-state">No sources yet.</p>`;
}

function renderSources(docs = []) {
    if (!docs.length) {
        clearSources();
        return;
    }

    sourcesList.innerHTML = "";

    docs.forEach((doc, index) => {
        const card = document.createElement("div");
        card.className = "source-card";

        const title = document.createElement("h3");
        title.textContent = `Document ${index + 1}`;

        const content = document.createElement("pre");
        content.textContent = doc.pageContent || "No content available";

        card.appendChild(title);
        card.appendChild(content);
        sourcesList.appendChild(card);
    });
}

async function sendPrompt(prompt) {
    addMessage(prompt, "user");

    const loadingMessage = addMessage("Thinking...", "bot", "loading");
    sendButton.disabled = true;
    testButton.disabled = true;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        loadingMessage.remove();

        if (!response.ok) {
            addMessage(data.error || `Server error: ${response.status}`, "bot");
            clearSources();
            return;
        }

        addMessage(
            data.answer || data.message || "No answer received.",
            "bot",
            "",
            data.toolsUsed || data.response?.toolsUsed || []
        );

        renderSources(data.relevantDocs || []);
    } catch (error) {
        loadingMessage.remove();
        addMessage(`Error: ${error.message}`, "bot");
        clearSources();
        console.error(error);
    } finally {
        sendButton.disabled = false;
        testButton.disabled = false;
    }
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const prompt = promptInput.value.trim();
    if (!prompt) return;

    promptInput.value = "";
    await sendPrompt(prompt);
});

testButton.addEventListener("click", async () => {
    addMessage("Running test question...", "user");

    const loadingMessage = addMessage("Thinking...", "bot", "loading");
    sendButton.disabled = true;
    testButton.disabled = true;

    try {
        const response = await fetch("/api/test");
        const data = await response.json();

        loadingMessage.remove();

        if (!response.ok) {
            addMessage(data.error || `Server error: ${response.status}`, "bot");
            clearSources();
            return;
        }

        addMessage(
            data.answer || data.message || "No answer received.",
            "bot",
            "",
            data.toolsUsed || data.response?.toolsUsed || []
        );

        renderSources(data.relevantDocs || []);
    } catch (error) {
        loadingMessage.remove();
        addMessage(`Error: ${error.message}`, "bot");
        clearSources();
        console.error(error);
    } finally {
        sendButton.disabled = false;
        testButton.disabled = false;
    }
});