export class AudioManager {
  constructor() {
    this.listening = false;
    this.callbacks = [];
    this.microphoneStream = null;
  }

  async startListening() {
    //console.log('🎤 Audio Manager: Starting listening (STUB - not implemented)');
    this.listening = true;

    return true;
  }

  async stopListening() {
    //console.log('🎤 Audio Manager: Stopping listening (STUB)');
    this.listening = false;

    if (this.microphoneStream) {
      this.microphoneStream = null;
    }

    return true;
  }

  onSpeechResult(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  isListening() {
    return this.listening;
  }

  async getAudioDevices() {
    return [
      { id: 'default', name: 'Default Microphone', type: 'input' },
      { id: 'system', name: 'System Audio', type: 'output' }
    ];
  }

  async setMicrophoneGain(gain) {
    //console.log(`🎤 Audio Manager: Setting microphone gain to ${gain} (STUB)`);
    return true;
  }

  async getVoiceActivityLevel() {
    return 0.0;
  }

  async configureSpeechRecognition(options = {}) {
    const defaultOptions = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    };

    const config = { ...defaultOptions, ...options };
    //console.log('🎤 Audio Manager: Configuring speech recognition (STUB):', config);
    return config;
  }

  mockSpeechInput(text) {
    //console.log(`🎤 Audio Manager: Mock speech input: "${text}"`);
    this.callbacks.forEach(callback => {
      callback({
        transcript: text,
        confidence: 0.95,
        isFinal: true,
        timestamp: Date.now()
      });
    });
  }
}

export default AudioManager;