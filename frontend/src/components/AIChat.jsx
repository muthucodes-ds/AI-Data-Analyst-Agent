import { useState } from "react";
import "./AIChat.css";

const API = "http://127.0.0.1:8000";

// --------------------------------
// BOLD TEXT FORMATTER
// --------------------------------
const formatBold = (text) => {
    if (!text) return null;

    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={index}>
                    {part.slice(2, -2)}
                </strong>
            );
        }

        return part;
    });
};

// --------------------------------
// AI RESPONSE FORMATTER
// --------------------------------
const renderResponse = (text) => {
    if (!text) return null;

    const normalized = text
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\s*(#{1,3}\s*(?:Answer|Results|Key Insight)\b)/gi, "\n$1\n")
        .replace(/\s+(?=\d+[\.\)]\s)/g, "\n")
        .replace(/\s+(-\s+)/g, "\n$1");

    const lines = normalized.split("\n");

    const elements = [];
    let listItems = [];
    let bulletItems = [];

    // --------------------------------
    // FLUSH NUMBERED LIST
    // --------------------------------
    const flushList = () => {
        if (!listItems.length) return;

        elements.push(
            <ol
                className="ai-numbered-list"
                key={`list-${elements.length}`}
            >
                {listItems.map((item, index) => (
                    <li key={index}>
                        {formatBold(item)}
                    </li>
                ))}
            </ol>
        );

        listItems = [];
    };

    // --------------------------------
    // FLUSH BULLET LIST
    // --------------------------------
    const flushBullets = () => {
        if (!bulletItems.length) return;

        elements.push(
            <ul
                className="ai-bullet-list"
                key={`bullets-${elements.length}`}
            >
                {bulletItems.map((item, index) => (
                    <li key={index}>
                        {formatBold(item)}
                    </li>
                ))}
            </ul>
        );

        bulletItems = [];
    };

    // --------------------------------
    // PROCESS CONTENT
    // --------------------------------
    const processContent = (content, index) => {
        const trimmed = content.trim();

        if (!trimmed) return;

        const numbered = trimmed.match(/^\d+[\.\)]\s*(.+)/);

        if (numbered) {
            flushBullets();
            listItems.push(numbered[1]);
            return;
        }

        const bullet = trimmed.match(/^[-*•]\s+(.+)/);

        if (bullet) {
            flushList();
            bulletItems.push(bullet[1]);
            return;
        }

        flushList();
        flushBullets();

        elements.push(
            <p
                key={`paragraph-${index}`}
                className="ai-response-paragraph"
            >
                {formatBold(trimmed)}
            </p>
        );
    };

    // --------------------------------
    // PROCESS EACH LINE
    // --------------------------------
    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) return;

        const heading = trimmed.match(
            /^#{1,3}\s*(Answer|Results|Key Insight)\s*:?\s*(.*)$/i
        );

        if (heading) {
            flushList();
            flushBullets();

            const section = heading[1].toLowerCase();

            elements.push(
                <h3
                    key={`heading-${index}`}
                    className={
                        section === "key insight"
                            ? "ai-insight-heading"
                            : "ai-section-heading"
                    }
                >
                    {section === "answer" && "📝 Answer"}
                    {section === "results" && "📊 Results"}
                    {section === "key insight" && "💡 Key Insight"}
                </h3>
            );

            if (heading[2]) {
                processContent(heading[2], index);
            }

            return;
        }

        processContent(trimmed, index);
    });

    flushList();
    flushBullets();

    // --------------------------------
    // GROUP KEY INSIGHT SECTION
    // --------------------------------
    const grouped = [];

    for (let i = 0; i < elements.length; i++) {
        const current = elements[i];

        if (current.props.className === "ai-insight-heading") {
            const insightContent = [];
            let j = i + 1;

            while (
                j < elements.length &&
                elements[j].props.className !== "ai-section-heading" &&
                elements[j].props.className !== "ai-insight-heading"
            ) {
                insightContent.push(elements[j]);
                j++;
            }

            grouped.push(
                <div
                    className="ai-insight"
                    key={`insight-${i}`}
                >
                    {current}
                    {insightContent}
                </div>
            );

            i = j - 1;
        } else {
            grouped.push(current);
        }
    }

    return grouped;
};

// ================================================
// AI CHAT COMPONENT
// ================================================
function AIChat({ file }) {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);

    // --------------------------------
    // SEND MESSAGE TO GEMINI
    // --------------------------------
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim() || loading) return;

        if (!file) {
            setChat((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content: "Please upload a dataset first."
                }
            ]);
            return;
        }

        const userMessage = message.trim();

        setChat((previous) => [
            ...previous,
            {
                role: "user",
                content: userMessage
            }
        ]);

        setMessage("");
        setLoading(true);

        try {
            const formData = new FormData();

            formData.append("file", file);
            formData.append("question", userMessage);

            const response = await fetch(`${API}/chat`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Unable to get AI response.");
            }

            const result = await response.json();

            setChat((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content:
                        result.answer ||
                        result.response ||
                        "No response received from AI."
                }
            ]);

        } catch (error) {
            setChat((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content:
                        "Something went wrong. Please check your backend server and try again."
                }
            ]);

            console.error("AI Chat Error:", error);

        } finally {
            setLoading(false);
        }
    };

    // ================================================
    // UI
    // ================================================
    return (
        <div className="ai-chat-container">

            {/* HEADER */}
            <div className="ai-chat-header">
                <div>
                    <h2>🤖 AI Data Assistant</h2>
                    <p>
                        Ask questions about your uploaded dataset.
                    </p>
                </div>

                <span className="ai-status">
                    ● AI Online
                </span>
            </div>

            {/* CHAT MESSAGES */}
            <div className="ai-chat-box">

                {chat.length === 0 && (
                    <div className="ai-chat-welcome">
                        <h3>👋 Hello! I'm your AI Data Assistant.</h3>

                        <p>
                            Upload your dataset and ask me anything
                            about your data.
                        </p>

                        <div className="ai-suggestions">
                            <p>💡 Try asking:</p>

                            <ul>
                                <li>Give me a summary of this dataset.</li>
                                <li>What are the important insights?</li>
                                <li>Show me the missing values.</li>
                                <li>Explain the overall data distribution.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {chat.map((item, index) => (
                    <div
                        key={index}
                        className={
                            item.role === "user"
                                ? "ai-message user-message"
                                : "ai-message assistant-message"
                        }
                    >
                        <div className="ai-message-label">
                            {item.role === "user"
                                ? "👤 You"
                                : "🤖 AI Assistant"}
                        </div>

                        <div className="ai-message-content">
                            {item.role === "assistant"
                                ? renderResponse(item.content)
                                : item.content}
                        </div>
                    </div>
                ))}

                {/* LOADING */}
                {loading && (
                    <div className="ai-message assistant-message">
                        <div className="ai-message-label">
                            🤖 AI Assistant
                        </div>

                        <p className="ai-loading">
                            Thinking... Please wait.
                        </p>
                    </div>
                )}

            </div>

            {/* MESSAGE INPUT */}
            <form
                className="ai-chat-input-area"
                onSubmit={sendMessage}
            >
                <input
                    type="text"
                    placeholder="Ask anything about your dataset..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />

                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                >
                    {loading ? "Thinking..." : "Send ➤"}
                </button>
            </form>

            {/* FOOTER */}
            <div className="ai-chat-footer">
                Powered by Gemini AI
            </div>

        </div>
    );
}

export default AIChat;
