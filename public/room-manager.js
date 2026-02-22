import { ref, set, get, onValue, onChildAdded, push, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase-config.js";

export class RoomManager {
    constructor() {
        this.currentRoomCode = null;
        this.currentUserName = "";
        this.currentUserReference = null;
    }

    async createRoom(roomCode, userName) {
        if (!roomCode || roomCode.length !== 8) {
            alert("8桁のコードが必要です。");
            return false;
        }
        const roomRef = ref(db, 'rooms/' + roomCode);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            alert("そのコードは既に使用されています。");
            return false;
        }
        await set(roomRef, { createdAt: serverTimestamp(), host: userName });
        return await this.joinRoom(roomCode, userName);
    }

    async joinRoom(roomCode, userName) {
        if (!roomCode || roomCode.length !== 8) return false;
        const roomRef = ref(db, 'rooms/' + roomCode);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
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

    sendMessage(text, voiceType) {
        if (!this.currentRoomCode || !text.trim()) return;
        const messagesRef = ref(db, `rooms/${this.currentRoomCode}/messages`);
        push(messagesRef, {
            sender: this.currentUserName,
            text: text,
            voiceType: voiceType,
            timestamp: serverTimestamp()
        });
    }

    // ユーザーリストの監視
    listenToUsers(onUsersUpdate) {
        const usersRef = ref(db, `rooms/${this.currentRoomCode}/users`);
        onValue(usersRef, (snapshot) => onUsersUpdate(snapshot.val()));
    }

    // メッセージの監視（onChildAddedを使って、追加されたものだけを1回ずつ処理）
    listenToMessages(onNewMessage) {
        const messagesRef = ref(db, `rooms/${this.currentRoomCode}/messages`);
        // 部屋に入った瞬間に古いメッセージが全部鳴るのを防ぐため、現在時刻以降のものに限定するのが理想的ですが、
        // 今回はonChildAddedで確実に1回ずつハンドリングします。
        onChildAdded(messagesRef, (snapshot) => {
            onNewMessage(snapshot.key, snapshot.val());
        });
    }
}
