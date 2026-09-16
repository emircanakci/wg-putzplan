"use client";
import { useState, useMemo } from "react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/* ---------------------------------------------------------------
   AYARLAR — isimleri ve görevleri burada değiştir
   --------------------------------------------------------------- */

const PEOPLE = ["Emirhan", "Baran", "Ege"];

const AREAS = [
  {
    id: "koridor",
    name: "Koridor",
    tasks: ["Süpürge", "Vileda", "Küvet Temizliği", "Bulaşık makinesi",],
    mini: { id: "cop", name: "Çöp" }, 
  },
  {
    id: "banyo",
    name: "Banyo",
    tasks: ["Lavabo & Ayna", "Klozet", "Süpürge", "Vileda"],
    mini: { id: "market", name: "Ortak market" },
  },
  {
    id: "mutfak",
    name: "Mutfak",
    tasks: ["Tezgah", "Ocak", "Bulaşık makinesi", "Süpürge", "Vileda"],
    mini: { id: "masa", name: "Mutfak Masası" },
  },
];


// Rotasyonun başladığı pazartesi
const START = new Date(2026, 8, 14);

/* --------------------------------------------------------------- */

const weekNow = () => Math.floor((Date.now() - START.getTime()) / 604800000);

const rotation = (week) =>
  PEOPLE.map((person, i) => {
    const areaIndex = (((i + week) % 3) + 3) % 3;
    const area = AREAS[areaIndex];

    // Haftaya göre çöp türünü otomatik belirle (Çift haftalar: Restmüll, Tek haftalar: Gelbe/Pappe)
    const copText = Math.abs(week) % 2 === 0 
      ? "Çöp ( Restmüll )" 
      : "Çöp ( Gelbe / Pappe )";

    // Eğer alan Koridor ise çöp ismini dinamik yap, değilse kendi mini görevini koru
    const mini = area.id === "koridor"
      ? { ...area.mini, name: copText }
      : area.mini;

    return {
      person,
      area,
      mini,
    };
  });

const weekLabel = (week) => {
  const monday = new Date(START.getTime() + week * 604800000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const f = (d) => `${d.getDate()}.${d.getMonth() + 1}`;
  return `${f(monday)} – ${f(sunday)}`;
};

const keyFor = (week, person, task) => `${week}|${person}|${task}`;

const timeAgo = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
};

export default function Putzplan() {
  const [week, setWeek] = useState(weekNow());
  const [me, setMe] = useState(PEOPLE[0]);
  const [done, setDone] = useState({});
  useEffect(() => {
  const load = async () => {
    const { data } = await supabase.from("completions").select("*").eq("week", week);
    const map = {};
    (data || []).forEach((r) => {
      map[`${r.week}|${r.person}|${r.task}`] = { by: r.checked_by, at: new Date(r.created_at).getTime() };
    });
    setDone(map);
  };
  load();

  const channel = supabase
    .channel("completions-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "completions" }, load)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [week]);
  const [nudge, setNudge] = useState(null);

  const plan = useMemo(() => rotation(week), [week]);
  const isCurrent = week === weekNow();

  const tasksOf = (entry) => [...entry.area.tasks.map((t) => `${entry.area.name}: ${t}`), entry.mini.name];

const toggle = async (person, task) => {
  const k = keyFor(week, person, task);

  // 1) Ekranı ANINDA güncelle (optimistic update)
  setDone((prev) => {
    const next = { ...prev };
    if (next[k]) {
      delete next[k];
    } else {
      next[k] = { by: me, at: Date.now() };
    }
    return next;
  });

  // 2) Arka planda Supabase'e yaz
  const wasChecked = done[k];
  if (wasChecked) {
    await supabase.from("completions").delete().eq("week", week).eq("person", person).eq("task", task);
  } else {
    await supabase
      .from("completions")
      .upsert(
        { week, person, task, checked_by: me },
        { onConflict: "week,person,task" }
      );
  }
};;

  const progressOf = (entry) => {
    const all = tasksOf(entry);
    return { done: all.filter((t) => done[keyFor(week, entry.person, t)]).length, total: all.length };
  };

  const mine = plan.find((p) => p.person === me);
  const others = plan.filter((p) => p.person !== me);
  const myProgress = progressOf(mine);
  

  const buildNudge = (entry) => {
    const missing = tasksOf(entry).filter((t) => !done[keyFor(week, entry.person, t)]);
    return `${entry.person}, bu hafta ${entry.area.name} sende. Kalanlar: ${missing.join(", ")}`;
  };

const openWhatsApp = (entry) => {
    const text = encodeURIComponent(buildNudge(entry));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="pp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700&family=Archivo+Expanded:wght@600;700&display=swap');

        .pp {
          --grout: #edede9;
          --tile: #ffffff;
          --ink: #173b21;
          --muted: #6B7A85;
          --line: #C9D3D9;
          --blue: #1550E8;
          --green: #0E9F6E; 
          --amber: #C77700;
          background: var(--grout);
          color: var(--ink);
          font-family: 'Archivo', system-ui, sans-serif;
          min-height: 100vh;
          padding: 18px 14px 40px;
          -webkit-font-smoothing: antialiased;
        }
        .pp * { box-sizing: border-box; }

        .bar { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
        .mark {
          font-family: 'Archivo Expanded', 'Archivo', sans-serif;
          font-weight: 700; font-size: 27px; letter-spacing: -0.01em;
        }
        .mark span { color: var(--blue); }
        .weeknav { display: flex; align-items: center; gap: 2px; }
        .weeknav button {
          background: none; border: none; color: var(--muted); font: inherit;
          font-size: 17px; line-height: 1; padding: 6px 8px; cursor: pointer; border-radius: 4px;
        }
        .weeknav button:hover { background: rgba(0,0,0,.05); color: var(--ink); }
        .weeknav button:disabled {opacity: 0.25;cursor: not-allowed;}
        .weeknav b { font-size: 13px; font-weight: 500; min-width: 86px; text-align: center; color: var(--muted); }

        .who { display: flex; gap: 3px; margin-bottom: 18px; background: var(--line); padding: 3px; border-radius: 5px; }
        .who button {
          flex: 1; border: none; background: transparent; font: inherit; font-size: 17px; font-weight: 500;
          color: var(--muted); padding: 8px 4px; border-radius: 3px; cursor: pointer;
        }
        .who button[data-on="1"] { background: var(--tile); color: var(--ink); font-weight: 600; }

        .hero {
          background: var(--tile); border-radius: 5px; padding: 20px 18px 0; margin-bottom: 8px;
          border: 1px solid var(--line); overflow: hidden;
        }
        .kicker { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
        .area {
          font-family: 'Archivo Expanded', 'Archivo', sans-serif; font-weight: 700;
          font-size: 34px; letter-spacing: -0.02em; line-height: 1; margin-bottom: 16px;
        }
        .fill { display: flex; gap: 3px; margin: 0 -18px; }
        .fill i { flex: 1; height: 5px; background: var(--line); }
        .fill i[data-on="1"] { background: var(--blue); }
        .fill i[data-all="1"] { background: var(--green); }

        .list { background: var(--tile); border: 1px solid var(--line); border-top: none; border-radius: 0 0 5px 5px; margin-bottom: 22px; }
        .row {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 13px 18px; border: none; background: none; font: inherit; text-align: left;
          border-top: 1px solid #EDF1F3; cursor: pointer;
        }
        .row:hover { background: #F7FAFB; }
        .box {
          width: 21px; height: 21px; flex: none; border: 1.5px solid var(--line); border-radius: 3px;
          display: grid; place-items: center; color: transparent; font-size: 13px; font-weight: 700;
        }
        .row[data-done="1"] .box { background: var(--green); border-color: var(--green); color: #fff; }
        .label { flex: 1; font-size: 15px; }
        .row[data-done="1"] .label { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--line); }
        .stamp { font-size: 11px; color: var(--muted); text-align: right; line-height: 1.3; flex: none; }
        .stamp b { display: block; color: var(--green); font-weight: 600; }
        .tag {
          font-size: 10px; font-weight: 600; color: var(--muted);
          border: 1px solid var(--line); border-radius: 3px; padding: 2px 5px; flex: none;
        }

        h2 { font-size: 12px; font-weight: 600; color: var(--muted); margin: 0 0 10px; }

        .card {
          background: var(--tile); border: 1px solid var(--line); border-radius: 5px;
          padding: 14px 16px; margin-bottom: 8px;
        }
        .card header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .name { font-weight: 600; font-size: 15px; }
        .sub { font-size: 13px; color: var(--muted); flex: 1; }
        .count { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
        .count[data-all="1"] { color: var(--green); font-weight: 600; }
        .poke {
          border: 1px solid var(--line); background: none; font: inherit; font-size: 12px; font-weight: 500;
          color: var(--amber); padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;
        }
        .poke:hover { background: #FFF8EC; }
        .msg-box {
          margin-top: 10px;
          background: #FFF8EC;
          border: 1px solid #F0DFBE;
          border-radius: 4px;
          padding: 10px 12px;
        }
        .msg {
          font-size: 13px;
          line-height: 1.5;
          color: #7A4E00;
          margin-bottom: 8px;
        }
        .wa-btn {
          border: none;
          background: #25D366;
          color: white;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .wa-btn:hover {
          background: #20bd5a;
        }
        
        .msg {
          margin-top: 10px; font-size: 13px; line-height: 1.5; background: #FFF8EC;
          border: 1px solid #F0DFBE; border-radius: 4px; padding: 10px 12px; color: #7A4E00;
        }
        .empty { font-size: 13px; color: var(--muted); padding: 4px 0 2px; }

        .score { display: flex; gap: 8px; }
        .score div { flex: 1; background: var(--tile); border: 1px solid var(--line); border-radius: 5px; padding: 12px; }
        .score em {
          font-style: normal; font-family: 'Archivo Expanded','Archivo',sans-serif;
          font-weight: 700; font-size: 22px; display: block; line-height: 1.1;
        }
        .score small { font-size: 12px; color: var(--muted); }
      `}</style>

      <div className="bar">
        <div className="mark">Putz-<span>WG</span></div>
    <div className="weeknav">
  <button 
    onClick={() => setWeek((prev) => Math.max(0, prev - 1))} 
    disabled={week <= 0} 
    aria-label="Önceki hafta"
  >
    ‹
  </button>
  <b>{isCurrent ? "Bu hafta" : weekLabel(week)}</b>
  <button 
    onClick={() => setWeek((prev) => prev + 1)} 
    aria-label="Sonraki hafta"
  >
    ›
  </button>
</div>
      </div>

      <div className="who">
        {PEOPLE.map((p) => (
          <button key={p} data-on={p === me ? 1 : 0} onClick={() => setMe(p)}>{p}</button>
        ))}
      </div>

      <div className="hero">
        <div className="kicker">{isCurrent ? "Bu hafta sende" : `${weekLabel(week)} haftası`}</div>
        <div className="area">{mine.area.name}</div>
        <div className="fill">
          {tasksOf(mine).map((t) => {
            const on = !!done[keyFor(week, me, t)];
            return <i key={t} data-on={on ? 1 : 0} data-all={myProgress.done === myProgress.total ? 1 : 0} />;
          })}
        </div>
      </div>

      <div className="list">
        {tasksOf(mine).map((t) => {
          const rec = done[keyFor(week, me, t)];
          const isMini = t === mine.mini.name;
          return (
            <button key={t} className="row" data-done={rec ? 1 : 0} onClick={() => toggle(me, t)}>
              <span className="box">✓</span>
              <span className="label">{isMini ? t : t.split(": ")[1]}</span>
              {isMini && !rec && <span className="tag">mini</span>}
              {rec && (
                <span className="stamp">
                  <b>{rec.by}</b>
                  {timeAgo(rec.at)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h2>Evin durumu</h2>
      {others.map((entry) => {
        const p = progressOf(entry);
        const complete = p.done === p.total;
        const missing = tasksOf(entry).filter((t) => !done[keyFor(week, entry.person, t)]);
        return (
          <div className="card" key={entry.person}>
            <header>
              <span className="name">{entry.person}</span>
              <span className="sub">{entry.area.name} · {entry.mini.name}</span>
              <span className="count" data-all={complete ? 1 : 0}>{p.done}/{p.total}</span>
            </header>
            {complete ? (
              <div className="empty">Hepsi bitti.</div>
            ) : (
              <>
                <div className="empty">Kalan: {missing.map((m) => m.replace(/^.*: /, "")).join(", ")}</div>
                <button className="poke" onClick={() => setNudge(nudge === entry.person ? null : entry.person)}>
                  Hatırlat
                </button>
                {nudge === entry.person && (
                  <div className="msg-box">
                    <div className="msg">{buildNudge(entry)}</div>
                    <button className="wa-btn" onClick={() => openWhatsApp(entry)}>
                      WhatsApp ile Gönder
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
      
      

      <h2 style={{ marginTop: 22 }}>Bu hafta</h2>
      <div className="score">
        {plan.map((entry) => {
          const p = progressOf(entry);
          return (
            <div key={entry.person}>
              <em>{p.done}<small style={{ fontWeight: 400 }}>/{p.total}</small></em>
              <small>{entry.person}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}