import { useEffect } from "react";
export function useWebView() {
  useEffect(() => {
    const update = () =>
      document.documentElement.style.setProperty(
        "--app-height",
        (window.visualViewport?.height || innerHeight) + "px",
      );
    const focus = (event) => {
      if (event.target.matches(".letter-word input,#answer"))
        setTimeout(() => {
          if (document.activeElement === event.target)
            event.target.scrollIntoView({
              block: "nearest",
              inline: "nearest",
            });
        }, 250);
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    document.addEventListener("focusin", focus);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      document.removeEventListener("focusin", focus);
    };
  }, []);
}
