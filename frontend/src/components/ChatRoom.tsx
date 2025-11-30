import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import "./ChatRoom.css";

interface ChatRoomProps {
  name: string;
  onLogout: () => void;
}

interface Message {
  sender: string;
  text: string;
  time?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ name, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    // 建立 Socket 連線（帶 credentials）
    socketRef.current = io({
      path: "/socket.io/",
      withCredentials: true, // 重要：傳送 cookie
    });

    const socket = socketRef.current;

    // 處理歷史訊息
    const handleHistory = (msgs: Message[]) => {
      setMessages(msgs);
    };

    // 處理新訊息
    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    // 處理未登入（被後端踢出）
    const handleAuthRequired = () => {
      alert("登入已過期，請重新登入");
      window.location.reload();
    };

    socket.on("history", handleHistory);
    socket.on("chat-message", handleChatMessage);
    socket.on("auth-required", handleAuthRequired);

    // 不需要再 emit "join"，後端會自動從 session 讀取

    return () => {
      socket.off("history", handleHistory);
      socket.off("chat-message", handleChatMessage);
      socket.off("auth-required", handleAuthRequired);
      socket.disconnect();
    };
  }, []);

    const handleSend = () => {
      if (!input.trim() || !socketRef.current) return;
      socketRef.current.emit("chat-message", input.trim());
      setInput("");
    };

    const handleLogout = async () => {
      if (!confirm("確定要登出嗎？")) return;

      try {
        // 先通知後端要登出（發送離開訊息）
        if (socketRef.current) {
          socketRef.current.emit("user-logout");
          socketRef.current.disconnect();
        }

        // 呼叫登出 API 清除 session
        await fetch("/logout", {
          method: "POST",
          credentials: "include",
        });

        // 呼叫父組件的 onLogout
        onLogout();
      } catch (error) {
        console.error("登出錯誤:", error);
        // 即使出錯也強制登出
        onLogout();
      }
    };


    
  return (
    <div className="chatroom-container">
      <div className="chat-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h1 className="chat-title" style={{ margin: 0 }}>聊天室 💬</h1>
          <button 
            onClick={handleLogout} 
            style={{ 
              padding: "10px 20px", 
              cursor: "pointer",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            登出
          </button>
        </div>
        <p className="chat-name">
          你的名字：<strong>{name}</strong>
        </p>

        <div className="messages">
          {messages.length === 0 && <p className="no-msg">還沒有訊息，開始聊天吧！</p>}
          {messages.map((msg, idx) => {
            const senderType =
              msg.sender === "system" ? "system" : msg.sender === name ? "user" : "other";

            const timeString = msg.time
              ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div key={idx} className={`message ${senderType}`}>
                {senderType === "other" && <strong>{msg.sender}: </strong>}
                {msg.text}
                {timeString && <span className="msg-time"> ({timeString})</span>}
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