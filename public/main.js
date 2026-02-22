import { RoomManager } from './room-manager.js';
import { VoiceLogic } from './voice-logic.js';

const roomManager = new RoomManager();
const voiceLogic = new VoiceLogic();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const messageLog = document.getElementById('messageLog');

let lastProcessedTimestamp = 0;

// 部屋に入る処理の共通化
function enterChatMode(code, name) {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    document.getElementById('displayRoom').innerText = `Room: ${code}`;
    
    // メッセージの監視開始
    roomManager.listenMessages((data) => {
        if (!data) return;
        
        messageLog.innerHTML = "";
        const sortedMessages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

        sortedMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'msg-bubble';
            div.innerHTML = `<strong>${msg.sender}</strong>: ${msg.text}`;
            messageLog.appendChild(div);

            // 新しいメッセージ（自分が送信したもの以外も含む）を音で再生
            if (msg.timestamp > lastProcessedTimestamp) {
                voiceLogic.playVoice(msg.text, msg.voiceType);
                lastProcessedTimestamp = msg.timestamp;
            }
        });
        messageLog.scrollTop = messageLog.scrollHeight;
    });
}

// ボタンイベント
document.getElementById('btnCreate').onclick = async () => {
    const name = document.getElementById('inputName').value;
    const code = document.getElementById('inputRoomCode').value;
    if (name && await roomManager.createRoom(code, name)) {
        enterChatMode(code, name);
    }
};

document.getElementById('btnJoin').onclick = async () => {
    const name = document.getElementById('inputName').value;
    const code = document.getElementById('inputRoomCode').value;
    if (name && await roomManager.joinRoom(code, name)) {
        enterChatMode(code, name);
    }
};

// マイクボタンの長押し処理
const btnTalk = document.getElementById('btnTalk');
btnTalk.onmousedown = () => {
    btnTalk.innerText = "録音中...";
    btnTalk.classList.add('recording');
    voiceLogic.startListening((text) => {
        const voiceType = document.getElementById('selectVoice').value;
        roomManager.sendMessage(text, voiceType);
    });
};

btnTalk.onmouseup = () => {
    btnTalk.innerText = "長押しして話す";
    btnTalk.classList.remove('recording');
    voiceLogic.stopListening();
};

document.getElementById('btnLeave').onclick = () => location.reload();
