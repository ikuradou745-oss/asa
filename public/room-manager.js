import { ref, set, get, onValue, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase-config.js";

export class RoomManager {
    constructor() {
        this.currentRoom = null;
        this.userName = "";
    }

    // 部屋を作成する（8桁コード）
    async createRoom(code, name) {
        if (code.length !== 8) {
            alert("コードは8桁で入力してください。");
            return false;
        }
        const roomRef = ref(db, 'rooms/' + code);
        const snapshot = await get(roomRef);
        
        if (snapshot.exists()) {
            alert("この部屋コードは既に使用されています。別のコードにしてください。");
            return false;
        }

        await set(roomRef, {
            createdAt: serverTimestamp(),
            host: name
        });
        
        this.currentRoom = code;
        this.userName = name;
        return true;
    }

    // 部屋に参加する
    async joinRoom(code, name) {
        if (code.length !== 8) {
            alert("コードは8桁で入力してください。");
            return false;
        }
        const roomRef = ref(db, 'rooms/' + code);
        const snapshot = await get(roomRef);
        
        if (!snapshot.exists()) {
            alert("部屋が見つかりません。コードを確認してください。");
            return false;
        }

        this.currentRoom = code;
        this.userName = name;
        return true;
    }

    // メッセージ（テキストと音色）を送信する
    sendMessage(text, voiceType) {
        if (!this.currentRoom) return;
        const messagesRef = ref(db, `rooms/${this.currentRoom}/messages`);
        push(messagesRef, {
            sender: this.userName,
            text: text,
            voiceType: voiceType,
            timestamp: serverTimestamp()
        });
    }

    // 新着メッセージをリアルタイムで監視する
    listenMessages(callback) {
        const messagesRef = ref(db, `rooms/${this.currentRoom}/messages`);
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            callback(data);
        });
    }
}
