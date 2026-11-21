let audioContext: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }
  return audioContext;
}

/**
 * Short high-pitched confirmation tone, similar to a supermarket barcode scanner.
 * Safe to call from click/Enter handlers; silently ignores unsupported browsers.
 */
export function playScanBeep() {
  try {
    const ctx = context();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 1800;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio is a convenience only; never block a sale.
  }
}
