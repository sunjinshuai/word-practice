import { useEffect, useRef, useState } from "react";
import {
  loadHistory,
  migrateLegacy,
  persistEvents,
  newEvent,
  deriveLearning,
  readLegacy,
} from "../services/history";
export function useLearning() {
  const [events, setEvents] = useState([]),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("正在加载默写记录…");
  const [learning, setLearning] = useState(() => ({
    reviews: readLegacy("u2-reviews-v1"),
    mistakes: readLegacy("u2-mistakes-v1"),
  }));
  const eventRef = useRef([]);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const rows = await migrateLegacy(await loadHistory());
        if (!live) return;
        eventRef.current = rows;
        setEvents(rows);
        setLearning(deriveLearning(rows));
        setStatus("默写记录已自动保存在当前设备。");
      } catch {
        if (live) setStatus("浏览器无法保存，本次记录仅在页面中保留。");
      } finally {
        if (live) setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  function record(kind, payload) {
    const event = newEvent(kind, payload);
    eventRef.current = [...eventRef.current, event];
    setEvents(eventRef.current);
    setLearning(deriveLearning(eventRef.current));
    persistEvents([event]).catch(() =>
      setStatus("本机保存失败，本次记录仅在页面中保留，请勿关闭页面。"),
    );
  }
  return { ...learning, events, ready, status, record };
}
