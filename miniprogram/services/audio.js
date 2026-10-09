const { ariaAudio } = require("../data/content.js");
class AudioService {
  constructor(api, onError) {
    this.api = api;
    this.enabled = true;
    this.onError = onError;
    this.voice = api.createInnerAudioContext();
    this.effect = api.createInnerAudioContext();
    this.voice.onError(() => onError("音频未能播放，请再点朗读。"));
    this.lastKey = 0;
  }
  stop() {
    this.voice.stop();
    this.effect.stop();
  }
  read(text) {
    this.stop();
    if (!this.enabled) return;
    const source = ariaAudio[text.replace("look/stand", "look")];
    if (!source) {
      this.onError("此词暂无独立音频，请听整题朗读。");
      return;
    }
    this.voice.src = source;
    this.voice.play();
  }
  key(deleting = false) {
    if (!this.enabled || Date.now() - this.lastKey < 30) return;
    this.lastKey = Date.now();
    this.effect.stop();
    this.effect.src = "/audio/" + (deleting ? "delete" : "key") + ".wav";
    this.effect.play();
  }
  error() {
    if (!this.enabled) return;
    this.effect.stop();
    this.effect.src = "/audio/error.wav";
    this.effect.play();
  }
  toggle() {
    this.stop();
    this.enabled = !this.enabled;
    return this.enabled;
  }
  destroy() {
    this.stop();
    this.voice.destroy();
    this.effect.destroy();
  }
}
module.exports = { AudioService };
