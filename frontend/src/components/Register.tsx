import React, { useState } from "react";
import ChatRoom from "./ChatRoom";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        alert("註冊成功！");
        setJoined(true); // 直接進入聊天室
      } else {
        alert(data.error || "註冊失敗");
      }
    } catch (err) {
      console.error(err);
      alert("無法連接伺服器");
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return <ChatRoom name={username} onLogout={() => setJoined(false)} />;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>註冊帳號</h2>
      <input
        type="text"
        placeholder="輸入名稱..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleRegister()}
      />
      <button onClick={handleRegister} disabled={loading}>
        {loading ? "註冊中..." : "註冊"}
      </button>
    </div>
  );
};

export default RegisterPage;
