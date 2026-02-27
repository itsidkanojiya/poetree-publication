import React, { useEffect, useState, useRef } from "react";

/**
 * Animates a number from 0 to target when the element is in view.
 * Lightweight: IntersectionObserver + requestAnimationFrame.
 */
const AnimatedCounter = ({ value, suffix = "", duration = 1500, className = "" }) => {
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const num = typeof value === "number" ? value : parseInt(value, 10) || 0;
    if (num === 0) {
      setCount(0);
      return;
    }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOut = 1 - (1 - progress) ** 2;
      setCount(Math.floor(easeOut * num));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {count}{suffix}
    </span>
  );
};

export default AnimatedCounter;
