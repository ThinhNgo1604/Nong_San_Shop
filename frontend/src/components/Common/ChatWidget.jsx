import { useState, useRef, useEffect } from "react";

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "bot",
            content: "Xin chào! Mình là trợ lý ảo của Nông Sản Shop. Bạn cần tư vấn sản phẩm hay hỗ trợ gì không? 🌱"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const suggestedQuestions = [
        "Shop có xoài không?",
        "Rau củ VietGAP giá bao nhiêu?",
        "Chính sách đổi trả như thế nào?",
        "Phí vận chuyển bao nhiêu?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async (customText) => {
        const trimmed = (customText ?? input).trim();
        if (!trimmed || loading) return;

        const newMessages = [...messages, { role: "user", content: trimmed }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const apiBase = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${apiBase}/api/chatbot/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: trimmed,
                    history: newMessages.slice(-6),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "bot", content: data.message || "Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé." }
                ]);
                return;
            }

            setMessages((prev) => [
                ...prev,
                { role: "bot", content: data.reply }
            ]);

        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "Không thể kết nối tới máy chủ. Bạn kiểm tra lại kết nối mạng nhé." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "28px", right: "24px", zIndex: 1000 }}>

            {isOpen && (
                <div className="cw-panel">
                    {/* Header */}
                    <div className="cw-header">
                        <div className="cw-header-info">
                            <div className="cw-avatar">
                                <span>🌱</span>
                                <span className="cw-avatar-status" />
                            </div>
                            <div>
                                <div className="cw-header-title">Trợ lý Nông Sản Shop</div>
                                <div className="cw-header-subtitle">
                                    <span className="cw-dot-online" /> Đang hoạt động
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="cw-close-btn"
                            aria-label="Đóng khung chat"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="cw-messages">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`cw-msg-row ${msg.role === "user" ? "cw-msg-row-user" : ""}`}
                            >
                                {msg.role === "bot" && (
                                    <div className="cw-msg-avatar">🌱</div>
                                )}
                                <div className={`cw-bubble ${msg.role === "user" ? "cw-bubble-user" : "cw-bubble-bot"}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="cw-msg-row">
                                <div className="cw-msg-avatar">🌱</div>
                                <div className="cw-bubble cw-bubble-bot cw-typing">
                                    <span className="cw-typing-dot" />
                                    <span className="cw-typing-dot" />
                                    <span className="cw-typing-dot" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Câu hỏi gợi ý */}
                    {messages.length === 1 && !loading && (
                        <div className="cw-suggestions">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(q)}
                                    className="cw-suggestion-chip"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="cw-input-bar">
                        <input
                            ref={inputRef}
                            type="text"
                            className="cw-input"
                            placeholder="Nhập câu hỏi của bạn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            className="cw-send-btn"
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            aria-label="Gửi"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Nút mở/đóng chat */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`cw-fab ${isOpen ? "cw-fab-open" : ""}`}
                aria-label={isOpen ? "Đóng khung chat" : "Mở trợ lý ảo"}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="27" height="27" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2C6.48 2 2 5.94 2 10.8c0 2.76 1.44 5.22 3.7 6.85-.12.98-.5 2.5-1.5 3.9-.16.23.03.55.31.5 1.9-.33 3.6-1.15 4.68-1.8.9.24 1.85.37 2.81.37 5.52 0 10-3.94 10-8.82S17.52 2 12 2z"
                            fill="currentColor"
                        />
                        <circle cx="8.5" cy="10.5" r="1.15" fill="#1b5e20" />
                        <circle cx="12" cy="10.5" r="1.15" fill="#1b5e20" />
                        <circle cx="15.5" cy="10.5" r="1.15" fill="#1b5e20" />
                    </svg>
                )}
                {!isOpen && <span className="cw-fab-ring" />}
                {!isOpen && messages.length === 1 && <span className="cw-fab-badge">1</span>}
            </button>

            <style>{`
                @keyframes cw-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }

                @keyframes cw-ring-pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.7); opacity: 0; }
                }

                @keyframes cw-panel-in {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes cw-typing-bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }

                .cw-fab {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(150deg, #4caf50, #1b5e20);
                    color: #fff;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    box-shadow: 0 8px 24px rgba(27, 94, 32, 0.35);
                    animation: cw-float 3.2s ease-in-out infinite;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    margin-left: auto;
                }

                .cw-fab:hover {
                    animation-play-state: paused;
                    transform: translateY(-3px) scale(1.06);
                    box-shadow: 0 12px 28px rgba(27, 94, 32, 0.42);
                }

                .cw-fab-open {
                    animation: none;
                    background: linear-gradient(150deg, #616161, #333);
                }

                .cw-fab-ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid rgba(76, 175, 80, 0.55);
                    animation: cw-ring-pulse 2.2s ease-out infinite;
                    pointer-events: none;
                }

                .cw-fab-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #e53935;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #fff;
                }

                .cw-panel {
                    width: 350px;
                    height: 480px;
                    margin-bottom: 14px;
                    margin-left: auto;
                    background: #fff;
                    border-radius: 20px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
                    animation: cw-panel-in 0.25s ease;
                }

                .cw-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, #388e3c, #1b5e20);
                    color: #fff;
                    flex-shrink: 0;
                }

                .cw-header-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .cw-avatar {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.18);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 19px;
                    flex-shrink: 0;
                }

                .cw-avatar-status {
                    position: absolute;
                    bottom: -1px;
                    right: -1px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #66bb6a;
                    border: 2px solid #1b5e20;
                }

                .cw-header-title {
                    font-weight: 700;
                    font-size: 14.5px;
                    line-height: 1.3;
                }

                .cw-header-subtitle {
                    font-size: 11.5px;
                    color: rgba(255, 255, 255, 0.85);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .cw-dot-online {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #a5d6a7;
                    display: inline-block;
                }

                .cw-close-btn {
                    background: rgba(255, 255, 255, 0.12);
                    border: none;
                    color: #fff;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    flex-shrink: 0;
                }

                .cw-close-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                .cw-messages {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 16px 14px;
                    background: #f4f7f5;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .cw-msg-row {
                    display: flex;
                    align-items: flex-end;
                    gap: 7px;
                    justify-content: flex-start;
                }

                .cw-msg-row-user {
                    justify-content: flex-end;
                }

                .cw-msg-avatar {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background: #e8f5e9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    flex-shrink: 0;
                }

                .cw-bubble {
                    max-width: 76%;
                    padding: 10px 14px;
                    font-size: 13.5px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
                }

                .cw-bubble-bot {
                    background: #fff;
                    color: #2b2b2b;
                    border-radius: 4px 16px 16px 16px;
                }

                .cw-bubble-user {
                    background: linear-gradient(135deg, #43a047, #2e7d32);
                    color: #fff;
                    border-radius: 16px 4px 16px 16px;
                }

                .cw-typing {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 14px;
                }

                .cw-typing-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #9e9e9e;
                    animation: cw-typing-bounce 1.2s infinite;
                }

                .cw-typing-dot:nth-child(2) { animation-delay: 0.15s; }
                .cw-typing-dot:nth-child(3) { animation-delay: 0.3s; }

                .cw-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 7px;
                    padding: 10px 14px;
                    border-top: 1px solid #eef0ee;
                    background: #fff;
                    flex-shrink: 0;
                }

                .cw-suggestion-chip {
                    background: #e9f5e9;
                    color: #2e7d32;
                    border: 1px solid #b8dfb8;
                    border-radius: 16px;
                    font-size: 12px;
                    padding: 6px 12px;
                    cursor: pointer;
                    transition: background 0.15s ease, transform 0.1s ease;
                }

                .cw-suggestion-chip:hover {
                    background: #d9edd9;
                    transform: translateY(-1px);
                }

                .cw-input-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    border-top: 1px solid #eef0ee;
                    background: #fff;
                    flex-shrink: 0;
                }

                .cw-input {
                    flex: 1;
                    min-width: 0;
                    border: 1.5px solid #e2e6e2;
                    border-radius: 999px;
                    padding: 10px 16px;
                    font-size: 13.5px;
                    outline: none;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .cw-input:focus {
                    border-color: #2e7d32;
                    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
                }

                .cw-send-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    border: none;
                    background: linear-gradient(135deg, #43a047, #1b5e20);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: transform 0.15s ease, filter 0.15s ease;
                }

                .cw-send-btn:hover:not(:disabled) {
                    transform: scale(1.07);
                    filter: brightness(1.05);
                }

                .cw-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 480px) {
                    .cw-panel {
                        width: calc(100vw - 32px);
                        height: 65vh;
                    }
                }
            `}</style>
        </div>
    );
}

export default ChatWidget;