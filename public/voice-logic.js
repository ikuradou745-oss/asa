export class VoiceLogic {
    constructor() {
        // 音声認識のセットアップ
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("お使いのブラウザは音声認識に対応していません。Chromeを使用してください。");
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ja-JP';
        this.recognition.interimResults = false;
        this.recognition.continuous = false;

        // オーディオ再生のセットアップ
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 音声認識を開始
    startListening(onResult) {
        try {
            this.recognition.start();
        } catch (e) {
            console.error("認識開始エラー:", e);
        }

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            onResult(text);
        };

        this.recognition.onerror = (event) => {
            console.error("音声認識エラー:", event.error);
        };
    }

    // 音声認識を停止
    stopListening() {
        this.recognition.stop();
    }

    // 受け取ったテキストを1文字ずつ解析して再生
    async playVoice(text, voiceType) {
        const characters = text.split('');
        for (const char of characters) {
            await this.playSyllable(char, voiceType);
            // 文字の間の待ち時間（スピード調整）
            await new Promise(resolve => setTimeout(resolve, 120));
        }
    }

    // 1文字の音を合成して鳴らす（本来はここでmp3を再生する）
    async playSyllable(char, voiceType) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // 声の「音色」を周波数でシミュレート
        let frequency = 440; // 標準
        if (voiceType === 'high') frequency = 880; // 高い声
        if (voiceType === 'low') frequency = 220;  // 低い声

        // 文字によって微妙にピッチを変えると「話している感」が出る
        const charCodeOffset = char.charCodeAt(0) % 100;
        oscillator.frequency.setValueAtTime(frequency + charCodeOffset, this.audioContext.currentTime);

        oscillator.type = (voiceType === 'high') ? 'square' : 'sine';

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        // 短く「プッ」と鳴らす
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
}
