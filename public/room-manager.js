import { ref, set, get, onValue, push, remove, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase-config.js";

export class RoomManager {
    constructor() {
        this.currentRoomCode = null;
        this.currentUserName = "";
        this.currentUserReference = null;
    }

    async createRoom(roomCode, userName) {
        if (roomCode.length !== 8) {
            alert("部屋のコードは8桁で入力してください。");
            return false;
        }
        const roomReference = ref(db, 'rooms/' + roomCode);
        const roomSnapshot = await get(roomReference);
        
        if (roomSnapshot.exists()) {
            alert("この部屋コードは既に存在します。別のコードにしてください。");
            return false;
        }

        await set(roomReference, {
            createdAt: serverTimestamp(),
            host: userName
        });
        
        return await this.joinRoom(roomCode, userName);
    }

    async joinRoom(roomCode, userName) {
        if (roomCode.length !== 8) {
            alert("部屋のコードは8桁で入力してください。");
            return false;
        }
        const roomReference = ref(db, 'rooms/' + roomCode);
        const roomSnapshot = await get(roomReference);
        
        if (!roomSnapshot.exists()) {
            alert("部屋が見つかりません。コードを確認してください。");
            return false;
        }

        this.currentRoomCode = roomCode;
        this.currentUserName = userName;

        // 部屋のユーザーリストに自分を追加
        this.currentUserReference = push(ref(db, `rooms/${roomCode}/users`), { name: userName });
        
        // ブラウザを閉じたときや通信が切れたときに自動でユーザーリストから削除する設定
        onDisconnect(this.currentUserReference).remove();

        return true;
    }

    leaveRoom() {
        if (this.currentUserReference) {
            remove(this.currentUserReference);
        }
        location.reload(); // ページをリロードして初期状態に戻す
    }

    sendMessage(messageText, selectedVoiceType) {
        if (!this.currentRoomCode || !messageText) return;
        const messagesReference = ref(db, `rooms/${this.currentRoomCode}/messages`);
        push(messagesReference, {
            sender: this.currentUserName,
            text: messageText,
            voiceType: selectedVoiceType,
            timestamp: serverTimestamp()
        });
    }

    listenToRoomData(onMessagesUpdate, onUsersUpdate) {
        const messagesReference = ref(db, `rooms/${this.currentRoomCode}/messages`);
        onValue(messagesReference, (snapshot) => {
            onMessagesUpdate(snapshot.val());
        });

        const usersReference = ref(db, `rooms/${this.currentRoomCode}/users`);
        onValue(usersReference, (snapshot) => {
            onUsersUpdate(snapshot.val());
        });
    }
}
