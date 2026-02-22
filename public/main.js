import { RoomManager } from './room-manager.js';
import { VoiceLogic } from './voice-logic.js';

const roomManagerInstance = new RoomManager();
const voiceLogicInstance = new VoiceLogic();

// すでに再生したメッセージを二重に再生しないためのタイムスタンプ
let lastProcessedMessageTimestamp = Date.now();

// 部屋に入ったときの画面切り替え処理
function transitionToRoomUI(roomCode) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('displayRoom').innerText = `Room: ${roomCode}`;

    // データベースの変更を監視して画面を更新する
    roomManagerInstance.listenToRoomData(
        (messagesData) => {
            const messageLogElement = document.getElementById('messageLog');
            messageLogElement.innerHTML = "";
            
            if (!messagesData) return;

            // 古い順に並び替え
            const sortedMessages = Object.values(messagesData).sort((a, b) => a.timestamp - b.timestamp);
            
            sortedMessages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message-bubble';
                messageDiv.innerHTML = `<strong>${message.sender}</strong>: ${message.text}`;
                messageLogElement.appendChild(messageDiv);
                
                // 新しいメッセージが来たら、日本語音声エンジンで読み上げる！
                if (message.timestamp > lastProcessedMessageTimestamp) {
                    voiceLogicInstance.playVoice(message.text, message.voiceType);
                    lastProcessedMessageTimestamp = message.timestamp;
                }
            });
            // 常に一番下（最新メッセージ）にスクロールする
            messageLogElement.scrollTop = messageLogElement.scrollHeight;
        },
        (usersData) => {
            const userListElement = document.getElementById('userList');
            userListElement.innerHTML = "";
            
            if (!usersData) return;

            Object.values(usersData).forEach(user => {
                const listElement = document.createElement('li');
                listElement.innerText = "🟢 " + user.name;
                userListElement.appendChild(listElement);
            });
        }
    );
}

// ボタンのクリックイベント設定
document.getElementById('btnCreate').onclick = async () => {
    const inputNameValue = document.getElementById('inputName').value;
    const inputRoomCodeValue = document.getElementById('inputRoomCode').value;
    if (inputNameValue && await roomManagerInstance.createRoom(inputRoomCodeValue, inputNameValue)) {
        transitionToRoomUI(inputRoomCodeValue);
    } else if (!inputNameValue) {
        alert("名前を入力してください。");
    }
};

document.getElementById('btnJoin').onclick = async () => {
    const inputNameValue = document.getElementById('inputName').value;
    const inputRoomCodeValue = document.getElementById('inputRoomCode').value;
    if (inputNameValue && await roomManagerInstance.joinRoom(inputRoomCodeValue, inputNameValue)) {
        transitionToRoomUI(inputRoomCodeValue);
    } else if (!inputNameValue) {
        alert("名前を入力してください。");
    }
};

document.getElementById('btnLeave').onclick = () => {
    roomManagerInstance.leaveRoom();
};

// マイクボタンの長押しイベント設定
const talkButtonElement = document.getElementById('btnTalk');

talkButtonElement.onmousedown = () => {
    talkButtonElement.innerText = "録音中... (離して送信)";
    talkButtonElement.style.background = "#ff2e63"; // 録音中は色を変える
    
    // 話し終わった内容を受け取って送信する
    voiceLogicInstance.startListening((recognizedText) => {
        const selectedVoiceTypeValue = document.getElementById('selectVoice').value;
        roomManagerInstance.sendMessage(recognizedText, selectedVoiceTypeValue);
    });
};

talkButtonElement.onmouseup = () => {
    talkButtonElement.innerText = "長押しして話す";
    talkButtonElement.style.background = "#e94560"; // 元の色に戻す
    voiceLogicInstance.stopListening();
};
