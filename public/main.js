import { RoomManager } from './room-manager.js';
import { VoiceLogic } from './voice-logic.js';

const roomManager = new RoomManager();
const voiceLogic = new VoiceLogic();

// 起動時にすでに存在するメッセージを無視するためのフラグ
let isInitialLoad = true;
const roomJoinTime = Date.now();

function transitionToRoomUI(roomCode) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('displayRoom').innerText = `Room: ${roomCode}`;

    // 1. ユーザーリストの監視
    roomManager.listenToUsers((usersData) => {
        const userList = document.getElementById('userList');
        userList.innerHTML = "";
        if (!usersData) return;
        Object.values(usersData).forEach(user => {
            const li = document.createElement('li');
            li.innerText = "● " + user.name;
            userList.appendChild(li);
        });
    });

    // 2. メッセージの監視（2回再生を防ぐためにonChildAddedを使用）
    roomManager.listenToMessages((msgId, message) => {
        // 部屋に入るより前の古いメッセージは無視する
        if (message.timestamp < roomJoinTime - 5000) return;

        const messageLog = document.getElementById('messageLog');
        
        // 画面にメッセージを表示
        const div = document.createElement('div');
        div.className = 'message-bubble';
        div.innerHTML = `<strong>${message.sender}</strong>: ${message.text}`;
        messageLog.appendChild(div);
        messageLog.scrollTop = messageLog.scrollHeight;

        // 【最重要】自分が言ったボイスは自分に流さない！（相手にだけ流す）
        if (message.sender !== roomManager.currentUserName) {
            voiceLogic.playVoice(message.text, message.voiceType);
        }
    });

    // 3. 部屋に入った瞬間に自動でマイクをONにする！
    startMicAuto();
}

function startMicAuto() {
    const btnToggleMic = document.getElementById('btnToggleMic');
    const micStatusIndicator = document.getElementById('micStatusIndicator');

    // UIを「ON」の状態にする
    micStatusIndicator.innerText = "マイクON: あなたの声を送信中";
    micStatusIndicator.classList.add('active');
    btnToggleMic.innerText = "マイクをOFFにする";
    btnToggleMic.classList.remove('muted');

    voiceLogic.startAlwaysOn((text) => {
        const selectedVoice = document.getElementById('selectVoice').value;
        roomManager.sendMessage(text, selectedVoice);
    });
}

// ボタン操作
document.getElementById('btnCreate').onclick = async () => {
    const name = document.getElementById('inputName').value;
    const code = document.getElementById('inputRoomCode').value;
    if (name && await roomManager.createRoom(code, name)) transitionToRoomUI(code);
};

document.getElementById('btnJoin').onclick = async () => {
    const name = document.getElementById('inputName').value;
    const code = document.getElementById('inputRoomCode').value;
    if (name && await roomManager.joinRoom(code, name)) transitionToRoomUI(code);
};

document.getElementById('btnLeave').onclick = () => roomManager.leaveRoom();

// ミュート（マイクON/OFF）切り替え
document.getElementById('btnToggleMic').onclick = function() {
    const micStatusIndicator = document.getElementById('micStatusIndicator');
    if (voiceLogic.isMicActive) {
        voiceLogic.stopAlwaysOn();
        this.innerText = "マイクをONにする";
        this.classList.add('muted');
        micStatusIndicator.innerText = "マイクOFF（ミュート中）";
        micStatusIndicator.classList.remove('active');
    } else {
        startMicAuto();
    }
};
