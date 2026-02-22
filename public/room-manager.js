import { ref, set, get, onValue, push, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase-config.js";

export class RoomManager {
    constructor() {
        this.currentRoomCode = null;
        this.currentUserName = "";
        this.currentUserReference = null;
    }

    async createRoom(roomCode, userName) {
        if (!roomCode || roomCode.length !== 8) {
            alert("8桁の英数字を入力してください。");
            return false;
        }
        const roomReference = ref(db, 'rooms/' + roomCode);
        const roomSnapshot = await get(roomReference);
        
        if (roomSnapshot.exists()) {
            alert("この部屋は既に使われています。");
            return false;
        }

        await set(roomReference, {
            createdAt: serverTimestamp(),
            host: userName
        });
        
        return await this.joinRoom(roomCode, userName);
    }

    async joinRoom(roomCode, userName) {
        if (!roomCode || roomCode.length !== 8) {
            alert("8桁のコードが必要です。");
            return false;
        }
        const roomReference = ref(db, 'rooms/' + roomCode);
        const roomSnapshot = await get(roomReference);
        
        if (!roomSnapshot.exists()) {
            alert("部屋が見つかりません。");
            return false;
        }

        this.currentRoomCode = roomCode;
        this.currentUserName = userName;
        this.currentUserReference = push(ref(db, `rooms/${roomCode}/users`), { name: userName });
        onDisconnect(this.currentUserReference).remove();

        return true;
    }

    leaveRoom() {
        if (this.currentUserReference) remove(this.currentUserReference);
        location.reload();
    }

    sendMessage(messageText, selectedVoiceType) {
        if (!this.currentRoomCode || !messageText.trim()) return;
        const messagesReference = ref(db, `rooms/${this.currentRoomCode}/messages`);
        push(messagesReference, {
            sender: this.currentUserName,
            text: messageText,
            voiceType: selectedVoiceType,
            timestamp: serverTimestamp()
        });
    }

    listenToRoomData(onMessagesUpdate, onUsersUpdate) {
        onValue(ref(db, `rooms/${this.currentRoomCode}/messages`), (snapshot) => {
            onMessagesUpdate(snapshot.val());
        });
        onValue(ref(db, `rooms/${this.currentRoomCode}/users`), (snapshot) => {
            onUsersUpdate(snapshot.val());
        });
    }
}
