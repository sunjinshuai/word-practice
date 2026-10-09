import { useEffect, useRef } from "react";
import { posColors } from "../domain/words";
export function Particles({ active, question }) {
  const root = useRef();
  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion:reduce)").matches)
      return;
    const dots = [];
    for (let i = 0; i < (innerWidth < 600 ? 40 : 64); i++) {
      const dot = document.createElement("i");
      dot.style.cssText = `left:${35 + Math.random() * 30}%;top:35%;background:${posColors[i % posColors.length]};width:${5 + Math.random() * 5}px;height:${i % 3 === 0 ? 5 : 10}px;border-radius:${i % 3 === 0 ? "50%" : "2px"}`;
      root.current.append(dot);
      const x = (Math.random() - 0.5) * Math.min(innerWidth * 0.85, 1000),
        rise = -(90 + Math.random() * innerHeight * 0.35),
        fall = innerHeight * 0.65 + Math.random() * 120,
        rotation = Math.random() * 360;
      const animation = dot.animate(
        [
          { opacity: 0, transform: "translate(0,0)" },
          {
            opacity: 1,
            transform: `translate(${x * 0.5}px,${rise}px) rotate(${rotation}deg)`,
            offset: 0.25,
          },
          { opacity: 0.95, offset: 0.7 },
          {
            opacity: 0,
            transform: `translate(${x}px,${fall}px) rotate(${rotation * 3}deg)`,
          },
        ],
        {
          duration: 1800 + Math.random() * 500,
          delay: Math.random() * 130,
          easing: "cubic-bezier(.2,.6,.4,1)",
        },
      );
      animation.onfinish = () => dot.remove();
      dots.push({ dot, animation });
    }
    return () =>
      dots.forEach(({ dot, animation }) => {
        animation.cancel();
        dot.remove();
      });
  }, [active, question]);
  return <div ref={root} id="celebration" aria-hidden="true" />;
}
