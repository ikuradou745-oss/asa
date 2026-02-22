export class VoiceLogic {
    constructor() {
        // マイクから音声を文字にする機能（SpeechRecognition）
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionApi) {
            alert("お使いのブラウザは音声認識に対応していません。Google Chromeをご使用ください。");
        }
        this.recognition = new SpeechRecognitionApi();
        this.recognition.lang = 'ja-JP';
        this.recognition.interimResults = false;

        // 声を出力する機能（SpeechSynthesis）の準備
        this.synth = window.speechSynthesis;
        this.japaneseVoice = null;

        // 日本語の音声モデルをロードしておく
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        // 日本語の声（Google 日本語など）を探す
        this.japaneseVoice = voices.find(voice => voice.lang === 'ja-JP') || null;
    }

    startListening(onResultCallback) {
        try {
            this.recognition.start();
            this.recognition.onresult = (event) => {
                const recognizedText = event.results[0][0].transcript;
                onResultCallback(recognizedText);
            };
            this.recognition.onerror = (event) => {
                console.error("音声認識エラー:", event.error);
            };
        } catch (e) {
            console.error("認識を既に開始しています", e);
        }
    }

    stopListening() {
        this.recognition.stop();
    }

    // 日本語で「あいうえお」と実際に読み上げる関数
    playVoice(text, voiceType) {
        if (!text) return;

        // 読み上げ用のオブジェクトを作成
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';

        // 日本語の音声モデルがあればセットする
        if (this.japaneseVoice) {
            utterance.voice = this.japaneseVoice;
        }

        // 音色（ピッチ）と話すスピードの調整
        if (voiceType === 'high') {
            utterance.pitch = 2.0;  // 一番高い声（アニメ声風）
            utterance.rate = 1.2;   // 少し早口
        } else if (voiceType === 'low') {
            utterance.pitch = 0.5;  // 一番低い声（野太い声）
            utterance.rate = 0.8;   // 少しゆっくり
        } else {
            utterance.pitch = 1.0;  // 普通の声
            utterance.rate = 1.0;   // 普通のスピード
        }

        // 実際に喋らせる
        this.synth.speak(utterance);
    }
}
