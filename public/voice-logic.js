export class VoiceLogic {
    constructor() {
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognitionApi();
        this.recognition.lang = 'ja-JP';
        this.recognition.interimResults = false;
        this.recognition.continuous = false; // 1回ごとに終了させて精度を上げるループ方式

        this.synth = window.speechSynthesis;
        this.isListening = false;
        this.japaneseVoice = null;

        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        this.japaneseVoice = voices.find(v => v.lang === 'ja-JP') || voices[0];
    }

    // 常時聞き取りの開始
    startContinuousListening(onTextDetected) {
        this.isListening = true;
        this.recognition.start();

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            if (text) onTextDetected(text);
        };

        this.recognition.onend = () => {
            // ミュートボタンが押されるまでループし続ける
            if (this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            console.error("認識エラー:", event.error);
            if (event.error !== 'no-speech') {
                this.stopListening();
            }
        };
    }

    stopListening() {
        this.isListening = false;
        this.recognition.stop();
    }

    // メッセージの読み上げ（多彩な音色）
    playVoice(text, voiceType) {
        if (!text) return;
        this.synth.cancel(); // 前の音声をキャンセルして詰まりを防止

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.japaneseVoice;

        // 音色設定（バリエーション豊かに）
        switch (voiceType) {
            case 'helium':
                utterance.pitch = 2.0; utterance.rate = 1.3; break;
            case 'child':
                utterance.pitch = 1.6; utterance.rate = 1.1; break;
            case 'giant':
                utterance.pitch = 0.6; utterance.rate = 0.9; break;
            case 'demon':
                utterance.pitch = 0.1; utterance.rate = 0.7; break;
            case 'robot':
                utterance.pitch = 1.0; utterance.rate = 0.8; break;
            case 'fast':
                utterance.pitch = 1.1; utterance.rate = 2.0; break;
            case 'slow':
                utterance.pitch = 0.9; utterance.rate = 0.5; break;
            default: // normal
                utterance.pitch = 1.0; utterance.rate = 1.0; break;
        }

        this.synth.speak(utterance);
    }
}
