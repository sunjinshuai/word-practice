import { useEffect, useRef, useState } from "react";
import { createAudio } from "../services/audio";
export function useAudio() {
  const service = useRef(null);
  service.current ||= createAudio();
  const [enabled, setEnabled] = useState(true),
    [status, setStatus] = useState("");
  useEffect(() => () => service.current.dispose(), []);
  return {
    enabled,
    status,
    stop: () => {
      service.current.stop();
      setStatus("");
    },
    read: (text) => {
      if (enabled) service.current.read(text, setStatus);
    },
    key: (deleting) => {
      if (enabled) service.current.key(deleting);
    },
    feedback: (ok) => {
      if (enabled) service.current.feedback(ok);
    },
    toggle: () => {
      service.current.stop();
      setStatus("");
      setEnabled((v) => !v);
    },
    unlock: service.current.unlock,
  };
}
