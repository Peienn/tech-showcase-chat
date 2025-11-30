import React, { useState, useEffect } from "react";
import ChatRoom from "./components/ChatRoom";

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  // 頁面載入時檢查 session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch(`/check-session`, {
        credentials: "include", // 重要：傳送 cookie
      });
      const data = await response.json();
      
      if (data.loggedIn) {
        setName(data.username);
        setJoined(true);
      }
    } catch (error) {
      console.error("檢查 session 失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return;

    try {
      const response = await fetch(`/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 重要：讓瀏覽器儲存 cookie
        body: JSON.stringify({ username: name.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        setJoined(true);
      } else {
        alert(data.error || "登入失敗");
      }
    } catch (error) {
      console.error("登入錯誤:", error);
      alert("無法連接到伺服器");
    }
  };

  const handleLogout = () => {
    setJoined(false);
    setName("");
  };

  if (loading) {
    return (
      <div className="join-container">
        <h2>載入中...</h2>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="join-container">
        <h2>加入聊天室 💬</h2>
        <input
          type="text"
          placeholder="輸入你的名稱..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />
        <button onClick={handleJoin}>加入</button>
      </div>
    );
  }

  return <ChatRoom name={name} onLogout={handleLogout} />;
};

export default App;