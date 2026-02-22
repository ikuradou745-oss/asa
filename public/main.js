import { RoomManager } from './room-manager.js';
import { VoiceLogic } from './voice-logic.js';

const roomManager = new RoomManager();
const voiceLogic = new VoiceLogic();

// 重複再生防止のための「再生済みIDリスト」
const processedMessageIds = new Set();
let isMicOn = false;

function transitionToRoomUI(roomCode) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('displayRoom').innerText = `Room: ${roomCode}`;

    roomManager.listenToRoomData(
        (messagesData) => {
            const messageLog = document.getElementById('messageLog');
            if (!messagesData) return;

            // IDを元に、新しいメッセージだけを特定する
            Object.keys(messagesData).forEach(msgId => {
                if (!processedMessageIds.has(msgId)) {
                    const message = messagesData[msgId];
                    
                    // 画面に追加
                    const div = document.createElement('div');
                    div.className = 'message-bubble';
                    div.innerHTML = `<strong>${message.sender}</strong>: ${message.text}`;
                    messageLog.appendChild(div);
                    messageLog.scrollTop = messageLog.scrollHeight;

                    // 再生
                    voiceLogic.playVoice(message.text, message.voiceType);

                    // 再生済みリストに登録
                    processedMessageIds.add(msgId);
                }
            });
        },
        (usersData) => {
            const userList = document.getElementById('userList');
            userList.innerHTML = "";
            if (!usersData) return;
            Object.values(usersData).forEach(user => {
                const li = document.createElement('li');
                li.innerText = "● " + user.name;
                userList.appendChild(li);
            });
        }
    );
}

// 部屋作成・参加
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

// 【常時ボイチャのトグル処理】
const btnToggleMic = document.getElementById('btnToggleMic');
const micStatusIndicator = document.getElementById('micStatusIndicator');

btnToggleMic.onclick = () => {
    isMicOn = !isMicOn;

    if (isMicOn) {
        // マイクON
        btnToggleMic.innerText = "マイクをOFFにする";
        btnToggleMic.classList.add('on');
        micStatusIndicator.innerText = "マイクON (あなたの声を送信中...)";
        micStatusIndicator.classList.add('on');

        voiceLogic.startContinuousListening((detectedText) => {
            const voiceType = document.getElementById('selectVoice').value;
            roomManager.sendMessage(detectedText, voiceType);
        });
    } else {
        // マイクOFF (ミュート)
        btnToggleMic.innerText = "マイクをONにする";
        btnToggleMic.classList.remove('on');
        micStatusIndicator.innerText = "マイクOFF";
        micStatusIndicator.classList.remove('on');
        
        voiceLogic.stopListening();
    }
};
