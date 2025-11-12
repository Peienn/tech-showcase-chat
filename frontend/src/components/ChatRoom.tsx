import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./ChatRoom.css";

interface ChatRoomProps {
  name: string;
}

interface Message {
  sender: string; // 使用者名稱或 'system'
  text: string;
  time?: string;
}

const socket = io("http://localhost:3000");

const ChatRoom: React.FC<ChatRoomProps> = ({ name }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);



useEffect(() => {
  // join 聊天室
  socket.emit("join", name);

  // 監聽訊息
  const handleMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };
  socket.on("chat-message", handleMessage);

  // 回傳清理函式，而不是直接回傳 socket.off()
  return () => {
    socket.off("chat-message", handleMessage);
  };
}, [name]);


  const handleSend = () => {
    if (!input.trim()) return;
    socket.emit("chat-message", input.trim());
    setInput("");
  };

  return (
    <div className="chatroom-container">
      <div className="chat-box">
        <h1 className="chat-title">聊天室 💬</h1>
        <p className="chat-name">
          你的名字：<strong>{name}</strong>
        </p>

        <div className="messages">
          {messages.length === 0 && <p className="no-msg">還沒有訊息，開始聊天吧！</p>}
          {messages.map((msg, idx) => {
            const senderType =
              msg.sender === "system" ? "system" : msg.sender === name ? "user" : "other";

            return (
              <div key={idx} className={`message ${senderType}`}>
                {senderType === "other" && <strong>{msg.sender}: </strong>}
                {msg.text}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={input}
            placeholder="輸入訊息..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>送出</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
