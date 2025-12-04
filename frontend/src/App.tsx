import React, { useState, useEffect } from "react";
import ChatRoom from "./components/ChatRoom";

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);


  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // 控制定義註冊視窗
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


    const handleRegister = async () => {
      if (!name.trim()) return;

      try {
            const registerRes = await fetch("/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ username: name.trim() }),
            });
            const registerData = await registerRes.json();

            if (!registerData.success) {
              alert(registerData.error || "註冊失敗");
              return;
            }
            
            // 註冊成功後立即登入
            const loginRes = await fetch("/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: name.trim() }),
              credentials: "include",
            });
            const loginData = await loginRes.json();

            if (loginData.success) {
              alert("註冊並登入成功！");
              setJoined(true); // 進聊天室
            } else {
              alert(loginData.error || "登入失敗");
            }
      } catch (err) {
        console.error(err);
        alert("無法連接伺服器");
      } finally {
        setLoading(false);
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
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleJoin}>加入</button>
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => setShowRegisterModal(true)}
            >
              註冊
            </button>
        </div>
        {/* 註冊視窗 */}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "6px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h3>註冊帳號</h3>
            <input
              type="text"
              placeholder="輸入註冊名稱..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              style={{ width: "80%", marginBottom: "10px" }}
            />
            <button onClick={handleRegister}>註冊</button>
            <button style={{ marginLeft: "10px" }} onClick={() => setShowRegisterModal(false)}> 取消</button>
          </div>
        </div>
      )}



      </div>
    );
  }




  return <ChatRoom name={name} onLogout={handleLogout} />;
};

export default App;