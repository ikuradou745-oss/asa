export class VoiceLogic {
    constructor() {
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognitionApi();
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = false; // ループ制御のためにfalse
        this.recognition.interimResults = false;

        this.synth = window.speechSynthesis;
        this.isMicActive = false;
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

    // 常時聞き取りモードの開始
    startAlwaysOn(onTextDetected) {
        this.isMicActive = true;
        
        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            if (text) onTextDetected(text);
        };

        this.recognition.onend = () => {
            // ミュートボタンで停止されていない限り、自動で再起動
            if (this.isMicActive) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.error("マイク再起動失敗:", e);
                }
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                alert("マイクの使用を許可してください。");
                this.isMicActive = false;
            }
        };

        this.recognition.start();
    }

    stopAlwaysOn() {
        this.isMicActive = false;
        this.recognition.stop();
    }

    // 音声再生（自分以外のボイスを鳴らす）
    playVoice(text, voiceType) {
        if (!text) return;
        
        // 前の音声が重ならないように一度リセット
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.japaneseVoice;

        // 【豊富な音色バリエーション】
        switch (voiceType) {
            case 'helium':
                utterance.pitch = 2.0; utterance.rate = 1.2; break;
            case 'pixie':
                utterance.pitch = 1.8; utterance.rate = 1.6; break;
            case 'giant':
                utterance.pitch = 0.5; utterance.rate = 0.9; break;
            case 'demon':
                utterance.pitch = 0.1; utterance.rate = 0.7; break;
            case 'robot':
                utterance.pitch = 1.0; utterance.rate = 0.6; break;
            case 'alien':
                utterance.pitch = 1.5; utterance.rate = 0.5; break;
            case 'ghost':
                utterance.pitch = 1.2; utterance.rate = 0.4; utterance.volume = 0.5; break;
            default: // normal
                utterance.pitch = 1.0; utterance.rate = 1.0; break;
        }

        this.synth.speak(utterance);
    }
}
