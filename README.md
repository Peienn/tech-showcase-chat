# 多人聊天室專案說明

使用 **Node.js + Express + Socket.IO** 作為後端，前端使用 **React + TypeScript + Vite**，實現多人即時聊天。

---

1. backend
   1. npm init -y 
   2. npm install express socket.io
   3. npm install --save-dev nodemon (程式碼異動會自動重啟伺服器)
   4. create server.js
   5. add "dev": "nodemon server.js" in package.json script (直接套用nodemon 而非node)
   6. npm run dev
2. frontend
   1. npm create vite@latest frontend (react + ts)
   2. npm install + npm install socket.io-client
   3. npm run dev

main.tsx是專案的進入點，把App掛在id="root"內，App是Root Component (根組件)，其他建立的組件都掛在App內

ChatRoom.tsx主要聊天室組件，負責：
- 連線後端 Socket.IO
- 發送與接收訊息
- 顯示使用者與其他人的訊息
- 自動滾動訊息到最底部
- 訊息 UI 設計與樣式
