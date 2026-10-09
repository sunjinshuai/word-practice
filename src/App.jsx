import { useState } from "react";
import { useLearning } from "./hooks/useLearning";
import { useAudio } from "./hooks/useAudio";
import { usePractice, selectItems } from "./hooks/usePractice";
import { useWebView } from "./hooks/useWebView";
import { SetupDialog } from "./components/SetupDialog";
import { HistoryDialog } from "./components/HistoryDialog";
import { PracticeCard } from "./components/PracticeCard";
import { Progress, Stats } from "./components/Progress";
import { Particles } from "./components/Particles";
import { LearningDrawers } from "./components/LearningDrawers";
export default function App() {
  const learning = useLearning(),
    audio = useAudio(),
    practice = usePractice(learning, audio);
  useWebView();
  const [setup, setSetup] = useState(true),
    [history, setHistory] = useState(false);
  const { session, item, settings } = practice;
  const items = selectItems(settings);
  const openSetup = () => {
    audio.stop();
    setSetup(true);
  };
  return (
    <>
      <Particles
        active={!!session?.judged && session.ok}
        question={session?.id + ":" + session?.index}
      />
      <div className="focus-toolbar">
        <button id="open-setup" className="text-btn" onClick={openSetup}>
          ☷ 选择练习
        </button>
        <button
          id="open-account"
          className="text-btn"
          onClick={() => {
            audio.stop();
            setHistory(true);
          }}
        >
          默写记录
        </button>
      </div>
      <div className="experience-tools">
        <span id="streak">连续答对 {session?.streak || 0} 题</span>
        <button
          id="sound-toggle"
          aria-pressed={audio.enabled}
          className="text-btn"
          onClick={audio.toggle}
        >
          ♪ 声音{audio.enabled ? "开" : "关"}
        </button>
      </div>
      <main>
        <section className="practice" aria-label="默写练习">
          <div className="sheet">
            <Progress
              completed={
                session
                  ? Math.min(
                      session.index + (session.judged ? 1 : 0),
                      session.queue.length,
                    )
                  : 0
              }
              total={session?.queue.length || 0}
            />
            {item ? (
              <PracticeCard
                key={session.id + ":" + session.index}
                item={item}
                session={session}
                direction={settings.direction}
                finish={practice.finish}
                wrongWord={practice.wrongWord}
                next={practice.next}
                audio={audio}
              />
            ) : (
              <div id="summary">
                <h2 id="result">
                  {session
                    ? session.queue.length
                      ? "本轮答对 " +
                        session.correct +
                        " / " +
                        session.queue.length +
                        " 题"
                      : "当前没有到期或未学的词"
                    : "单词练习簿"}
                </h2>
                <p id="result-detail">
                  {session
                    ? "每一次练习，都让单词更熟悉一点。"
                    : "选择单元和范围，开始练习。"}
                </p>
                <button id="again" className="primary" onClick={openSetup}>
                  开始新一轮 →
                </button>
              </div>
            )}
          </div>
          <Stats
            total={session?.queue.length || 0}
            correct={session?.correct || 0}
            wrong={session?.wrong || 0}
          />
        </section>
        {!item && (
          <LearningDrawers
            items={items}
            learning={learning}
            settings={settings}
            onRetry={() => practice.start({ ...settings, mode: "mistakes" })}
          />
        )}
      </main>
      <SetupDialog
        key={setup ? "open" : "closed"}
        open={setup}
        settings={settings}
        ready={learning.ready}
        onClose={() => setSetup(false)}
        onStart={(options) => {
          audio.unlock();
          practice.start(options);
          setSetup(false);
        }}
      />
      <HistoryDialog
        open={history}
        onClose={() => setHistory(false)}
        events={learning.events}
        status={learning.status}
      />
    </>
  );
}
