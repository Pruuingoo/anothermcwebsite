"use client";

import { useState } from "react";

export function CopyIP({ label, address, port }: { label: string; address: string; port?: string }) {
  const [state, setState] = useState("");

  const copy = async () => {
    const text = port ? `${address}:${port}` : address;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setState("Copied");
    } catch {
      setState("Copy failed");
    }
    window.setTimeout(() => setState(""), 1800);
  };

  return (
    <button className="ip" type="button" onClick={copy}>
      <span>
        <span className="ip__label">{label}</span>
        <span className="ip__value">{address}{port ? ` · ${port}` : ""}</span>
      </span>
      <span className="ip__btn" aria-live="polite">{state || "Copy"}</span>
    </button>
  );
}
