import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (name.trim()) setJoined(true);
  };

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

  return <ChatRoom name={name} />;
};

export default App;
