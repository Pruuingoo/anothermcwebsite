"use client";

import { useEffect, useState } from "react";

type State = { online: boolean; count: number; max: number; players: Array<{ name: string; uuid?: string; sessionTime?: string | number; skinUrl?: string }> };

export default function LivePlayerList() {
  const [state, setState] = useState<State | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("[data-open-player-list]")) setOpen(true);
      if ((event.target as HTMLElement).closest("[data-close-player-list]")) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => {
    if (!open) return;
    let live = true;
    const load = () => fetch("/api/players", { cache: "no-store" }).then((r) => r.json()).then((v) => { if (live) setState(v); }).catch(() => {});
    void load();
    const id = window.setInterval(load, 30_000);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { live = false; window.clearInterval(id); window.removeEventListener("keydown", onKey); };
  }, [open]);
  const players = state?.players ?? [];
  return <>
    {open && <div className="wc-player-modal-backdrop" data-close-player-list>
      <section className="wc-player-modal" role="dialog" aria-modal="true" aria-labelledby="wc-player-modal-title" onClick={(event) => event.stopPropagation()}>
        <header><div><span>LIVE SERVER</span><h2 id="wc-player-modal-title">Online Players</h2></div><strong>{state ? `${state.count}/${state.max}` : "…"}</strong><button type="button" data-close-player-list aria-label="Close player list">×</button></header>
        {players.length ? <div className="wc-live-players__list">{players.map((player) => <div className="wc-live-player" key={player.uuid || player.name}>
          <img src={player.skinUrl || "/server-placeholder.svg"} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = "/server-placeholder.svg"; }} />
          <span>{player.name}{player.sessionTime !== undefined && <small>{String(player.sessionTime)}</small>}</span><i aria-label="Online" />
        </div>)}</div> : <p className="wc-live-players__empty">{state?.online && state.count === 0 ? "No players are online right now." : state?.online ? "Players are online, but their details haven’t arrived in the database yet." : "Player data is temporarily unavailable."}</p>}
      </section>
    </div>}
  </>;
}
