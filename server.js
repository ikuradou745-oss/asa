const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// publicフォルダのファイルを画面として表示する設定
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('誰かが接続しました！');
    
    // 自分のIDを通知
    socket.emit('me', socket.id);

    // 通話のシグナリング処理
    socket.on('callUser', (data) => {
        io.to(data.userToCall).emit('callUser', {
            signal: data.signalData,
            from: data.from
        });
    });

    socket.on('answerCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
