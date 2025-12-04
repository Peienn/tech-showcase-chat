import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(50); // 跳過 Redis 的 50 條

  // 確保 Ref 型別與 DOM 元素匹配
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const initialLoadRef = useRef(true); // 控制初次載入訊息時的滾動

  // 滾動到底函數 (優化版)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        // 使用 'nearest' 確保滾動不會過度，讓底部訊息完全可見
        block: "nearest",
      });
    }
  };

  /**
   * 初次載入訊息時滾到底
   * 使用 useLayoutEffect 確保在瀏覽器繪製前執行滾動，避免閃爍。
   */
  useLayoutEffect(() => {
    if (initialLoadRef.current && messages.length > 0) {
      // 第一次載入歷史訊息後，立即滾到底部
      scrollToBottom();
      initialLoadRef.current = false;
    }
  }, [messages]);

  const loadMoreHistory = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/message/history?limit=50&offset=${offset}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("載入失敗");

      const data = await response.json();

      if (data.messages.length === 0) {
        setHasMore(false);
        return;
      }

      const container = messagesContainerRef.current;
      const scrollHeightBefore = container?.scrollHeight || 0;
      const scrollTopBefore = container?.scrollTop || 0;

      // 將歷史訊息加到前面
      setMessages((prev) => [...data.messages, ...prev]);
      setOffset((prev) => prev + data.messages.length);

      // 恢復滾動位置 (確保用戶在載入新歷史訊息後仍停留在原來的對話位置)
      setTimeout(() => {
        if (container) {
          const scrollHeightAfter = container.scrollHeight;
          container.scrollTop = scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
        }
      }, 0);
    } catch (error) {
      console.error("載入歷史訊息失敗:", error);
      alert("載入歷史訊息失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socketRef.current = io({ path: "/socket.io/", withCredentials: true });

    const socket = socketRef.current;

    const handleHistory = (msgs: Message[]) => {
      setMessages(msgs);
      // 這裡不需要手動滾動，交由 useLayoutEffect 處理初次滾動
    };

    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // 新訊息到達，自動滾到底
      setTimeout(() => {
          scrollToBottom();
      }, 50); // 增加 50 毫秒的延遲
    };

    const handleAuthRequired = () => {
      alert("登入已過期，請重新登入");
      window.location.reload();
    };

    socket.on("history", handleHistory);
    socket.on("chat-message", handleChatMessage);
    socket.on("auth-required", handleAuthRequired);

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
      if (socketRef.current) {
        socketRef.current.emit("user-logout");
        socketRef.current.disconnect();
      }

      await fetch("/logout", { method: "POST", credentials: "include" });

      onLogout();
    } catch (error) {
      console.error("登出錯誤:", error);
      onLogout();
    }
  };

  return (
    <div className="chatroom-container">
      <div className="chat-box">
        {/* 標題與登出按鈕容器 (使用 CSS 類別 `chat-header`) */}
        <div className="chat-header">
          <h1 className="chat-title">
            聊天室 💬
          </h1>
          <button
            onClick={handleLogout}
            className="logout-button" // 使用 CSS 類別
          >
            登出
          </button>
        </div>

        <p className="chat-name">
          你的名字：<strong className="user-name-highlight">{name}</strong>
        </p>

        <div className="messages" ref={messagesContainerRef}>
          {hasMore && (
            <button
              onClick={loadMoreHistory}
              disabled={loading}
              className={`load-more-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? "載入中..." : "載入更多歷史訊息"}
            </button>
          )}

          {!hasMore && messages.length > 50 && (
            <div className="all-loaded">已載入所有歷史訊息</div>
          )}

          {messages.length === 0 && (
            <p className="no-msg">還沒有訊息，開始聊天吧！</p>
          )}

          {messages.map((msg, idx) => {
            const senderType = msg.sender === "system" ? "system" : msg.sender === name ? "user" : "other";
            const timeString = msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div key={idx} className={`message ${senderType}`}>
                {senderType === "other" && <strong>{msg.sender}: </strong>}
                {msg.text}
                {timeString && <span className="msg-time"> ({timeString})</span>}
              </div>
            );
          })}
          {/* 滾動目標元素 (使用 CSS 類別 `messages-end-spacer`) */}
          <div ref={messagesEndRef} className="messages-end-spacer" />
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