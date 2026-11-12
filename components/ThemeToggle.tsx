"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("server-theme");
    const nextLight = saved === "light";
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
  }, []);

  const toggle = () => {
    const nextLight = !light;
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
    window.localStorage.setItem("server-theme", nextLight ? "light" : "dark");
  };

  return (
    <button className="iconbtn" type="button" onClick={toggle} aria-label={`Switch to ${light ? "dark" : "light"} theme`} title={`Switch to ${light ? "dark" : "light"} theme`}>
      <span aria-hidden="true">{light ? "☾" : "☀"}</span>
    </button>
  );
}
