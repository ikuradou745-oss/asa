export class VoiceLogic {
    constructor() {
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionApi) {
            alert("お使いのブラウザは音声認識に対応していません。Google Chromeを使用してください。");
        }
        this.recognition = new SpeechRecognitionApi();
        this.recognition.lang = 'ja-JP';
        this.recognition.interimResults = false;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    startListening(onResultCallback) {
        this.recognition.start();
        this.recognition.onresult = (event) => {
            const recognizedText = event.results[0][0].transcript;
            onResultCallback(recognizedText);
        };
    }

    stopListening() {
        this.recognition.stop();
    }

    async playVoice(text, voiceType) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const charactersArray = text.split('');
        for (const character of charactersArray) {
            await this.playSingleSyllable(character, voiceType);
            // 文字と文字の間の間隔（ミリ秒）
            await new Promise(resolve => setTimeout(resolve, 120));
        }
    }

    async playSingleSyllable(character, voiceType) {
        return new Promise((resolve) => {
            // まずはMP3ファイル（例: sounds/normal/あ.mp3）を再生しようと試みる
            const audioPath = `sounds/${voiceType}/${character}.mp3`;
            const audioObject = new Audio(audioPath);
            
            audioObject.onended = () => {
                resolve(); // MP3の再生が成功したら次へ
            };

            // MP3ファイルが見つからない（エラーの）場合は、シンセサイザーで音を作る
            audioObject.onerror = () => {
                this.playSynthesizedAnimaleseSound(character, voiceType);
                setTimeout(resolve, 80); // シンセサイザー音の長さ分だけ待つ
            };

            // 再生開始
            audioObject.play().catch(() => {
                // 自動再生ブロックなどに引っかかった場合もシンセサイザーを使う
                this.playSynthesizedAnimaleseSound(character, voiceType);
                setTimeout(resolve, 80);
            });
        });
    }

    // MP3がない場合の「どうぶつの森風」ピコピコ音生成ロジック
    playSynthesizedAnimaleseSound(character, voiceType) {
        const oscillatorNode = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // ベースとなる周波数（音の高さ）を設定
        let baseFrequency = 440; // ノーマル
        if (voiceType === 'high') baseFrequency = 880; // 高い声
        if (voiceType === 'low') baseFrequency = 220;  // 低い声

        // 文字の文字コードを使って、文字ごとに微妙に音の高さを変える（話している感が出る）
        const characterCodeOffset = character.charCodeAt(0) % 150;
        oscillatorNode.frequency.setValueAtTime(baseFrequency + characterCodeOffset, this.audioContext.currentTime);

        // 高い声は電子音っぽく、それ以外は丸い音にする
        oscillatorNode.type = (voiceType === 'high') ? 'square' : 'sine';

        oscillatorNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillatorNode.start();
        // 0.08秒だけ短く鳴らして「プッ」という音にする
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.08);
        oscillatorNode.stop(this.audioContext.currentTime + 0.08);
    }
}
