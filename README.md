# 多人聊天室專案說明

使用 **Node.js + Express + Socket.IO** 作為後端，前端使用 **React + TypeScript + Vite**，實現多人即時聊天。

---
下載後安裝package再使用。
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


## 加入Nginx，實現反向代理和流量控制 - 2025/11/15

- 多一個backend2是為了測試Nginx的流量控制。
- frontend裡面多一個dist是因為把前端打包後要給Nginx使用
- Nginx安裝好後，只修改了/conf/nginx.conf即可，因此不把Nginx資料夾一起上拋