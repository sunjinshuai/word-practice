import { ariaAudio } from "../data/content";
export function createAudio() {
  let active = null,
    generation = 0,
    context,
    lastKey = 0;
  function stop() {
    generation++;
    if (active) {
      active.pause();
      active.removeAttribute("src");
      active.load();
      active = null;
    }
  }
  async function read(text, onStatus = () => {}) {
    stop();
    const token = generation;
    const source = ariaAudio[text.replace("look/stand", "look")];
    if (!source) {
      onStatus("此项音频暂不可用");
      return;
    }
    const player = new Audio(import.meta.env.BASE_URL + source);
    active = player;
    onStatus("朗读中…");
    const finish = (error) => {
      if (token !== generation) return;
      stop();
      onStatus(error ? "音频未能播放，请点击朗读重试" : "");
    };
    player.onended = () => finish(false);
    player.onerror = () => finish(true);
    try {
      await player.play();
    } catch {
      finish(true);
    }
  }
  function unlock() {
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch {}
  }
  function tone(frequency, delay = 0, duration = 0.15) {
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      at = context.currentTime + delay;
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.04, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  function key(deleting = false) {
    if (performance.now() - lastKey < 25) return;
    lastKey = performance.now();
    unlock();
    tone(deleting ? 430 : 740, 0, 0.065);
  }
  function feedback(ok) {
    unlock();
    (ok ? [523, 659, 784] : [220, 175]).forEach((f, i) =>
      tone(f, i * 0.1, 0.23),
    );
  }
  return {
    stop,
    read,
    key,
    feedback,
    unlock,
    dispose() {
      stop();
      context?.close();
    },
  };
}
