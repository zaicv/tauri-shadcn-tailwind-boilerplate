import { useEffect, useRef, useState } from "react";

export function useMicVolume() {
  const [volume, setVolume] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setVolume(avg / 255); // Normalize 0–1
        rafId.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      ctx.close();
    };
  }, []);

  return volume; // Between 0 and 1
}