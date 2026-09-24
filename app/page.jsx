"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Bell } from 'lucide-react';

/* ---------------------------------------------------------------
   AYARLAR — isimleri ve görevleri burada değiştir
   --------------------------------------------------------------- */

const PEOPLE = ["Emirhan", "Baran", "Ege"];
const NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BJKZav5q_i3ePH20xQv9BKLYejL1eLo-kkCeYgXxAEOBr3kiq1Dfy5iXGmiMEvWumuwhEOI5p4bX5UH5SKe0rC8";
const LANGS = ["tr", "en", "de"];

const AREAS = [
  {
    id: "koridor",
    name: { tr: "Koridor", en: "Hallway", de: "Flur" },
    tasks: [
      { id: "supurge", label: { tr: "Süpürge", en: "Vacuum", de: "Staubsaugen" } },
      { id: "vileda", label: { tr: "Vileda", en: "Mopping", de: "Wischen" } },
      { id: "kuvet", label: { tr: "Küvet Temizliği", en: "Tub Cleaning", de: "Wannenreinigung" } },
      { id: "bulasikmakinesi", label: { tr: "Bulaşık makinesi", en: "Dishwasher", de: "Geschirrspüler" } },
      { id: "cop_cikar", label: { tr: "Çöpü çıkartma", en: "Take out the trash", de: "Müll rausbringen" } },
    ],
    miniId: "cop",
  },
  {
    id: "banyo",
    name: { tr: "Banyo", en: "Bathroom", de: "Badezimmer" },
    tasks: [
      { id: "lavabo", label: { tr: "Lavabo", en: "Sink", de: "Waschbecken" } },
      { id: "ayna", label: { tr: "Ayna", en: "Mirror", de: "Spiegel" } },
      { id: "klozet", label: { tr: "Klozet", en: "Toilet", de: "Toilette" } },
      { id: "supurge", label: { tr: "Süpürge", en: "Vacuum", de: "Staubsaugen" } },
      { id: "vileda", label: { tr: "Vileda", en: "Mopping", de: "Wischen" } },
      { id: "bulasikmakinesi", label: { tr: "Bulaşık makinesi", en: "Dishwasher", de: "Geschirrspüler" } },
    ],
    miniId: "market",
  },
  {
    id: "mutfak",
    name: { tr: "Mutfak", en: "Kitchen", de: "Küche" },
    tasks: [
      { id: "tezgah", label: { tr: "Tezgah", en: "Countertop", de: "Arbeitsplatte" } },
      { id: "ocak", label: { tr: "Ocak", en: "Stove", de: "Herd" } },
      { id: "bulasikmakinesi", label: { tr: "Bulaşık makinesi", en: "Dishwasher", de: "Geschirrspüler" } },
      { id: "supurge", label: { tr: "Süpürge", en: "Vacuum", de: "Staubsaugen" } },
      { id: "vileda", label: { tr: "Vileda", en: "Mopping", de: "Wischen" } },
      { id: "cop_cikar", label: { tr: "Çöpü çıkartma", en: "Take out the trash", de: "Müll rausbringen" } },
    ],
    miniId: "masa",
  },
];

const MINI = {
  market: { tr: "Ortak market", en: "Shared groceries", de: "Gemeinsamer Einkauf" },
  masa: { tr: "Mutfak Masası", en: "Kitchen Table", de: "Küchentisch" },
};

const trashLabel = (week, lang) => {
  const even = Math.abs(week) % 2 === 0;
  const map = {
    tr: even ? "Çöp ( Restmüll )" : "Çöp ( Gelbe / Pappe )",
    en: even ? "Trash (General waste)" : "Trash (Recycling/Paper)",
    de: even ? "Müll (Restmüll)" : "Müll (Gelbe Tonne/Pappe)",
  };
  return map[lang];
};

const UI = {
  tr: {
    leaderboard: "Toplam Puan",
    viewOnly: "Bu hafta sadece görüntüleniyor, değişiklik yapılamaz.",
    thisWeek: "Bu hafta",
    yourWeek: "Bu hafta sende",
    weekOf: (label) => `${label} haftası`,
    homeStatus: "Evin durumu",
    allDone: "Hepsi bitti.",
    remaining: (list) => `Kalan: ${list}`,
    remind: "Hatırlat",
    sendWhatsapp: "WhatsApp ile Gönder",
    sendPush: "Push Bildirimi Gönder 🔔",
    weekScore: "Bu hafta",
    mini: "mini",
    prevWeek: "Önceki hafta",
    nextWeek: "Sonraki hafta",
    theme: "Tema değiştir",
    nudge: (person, area, list) => `${person}, bu hafta ${area} sende. Kalanlar: ${list}`,
  },
  en: {
    leaderboard: "Total Points",
    viewOnly: "This week is view-only — no changes allowed.",
    thisWeek: "This week",
    yourWeek: "Your week",
    weekOf: (label) => `Week of ${label}`,
    homeStatus: "Household status",
    allDone: "All done.",
    remaining: (list) => `Remaining: ${list}`,
    remind: "Remind",
    sendWhatsapp: "Send via WhatsApp",
    sendPush: "Send Push Notification 🔔",
    weekScore: "This week",
    mini: "mini",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    theme: "Toggle theme",
    nudge: (person, area, list) => `${person}, ${area} is yours this week. Remaining: ${list}`,
  },
  de: {
    leaderboard: "Gesamtpunkte",
    viewOnly: "Diese Woche ist nur zur Ansicht — keine Änderungen möglich.",
    thisWeek: "Diese Woche",
    yourWeek: "Diese Woche bist du dran",
    weekOf: (label) => `Woche vom ${label}`,
    homeStatus: "Haushaltsstatus",
    allDone: "Alles erledigt.",
    remaining: (list) => `Verbleibend: ${list}`,
    remind: "Erinnern",
    sendWhatsapp: "Per WhatsApp senden",
    sendPush: "Push-Benachrichtigung senden 🔔",
    weekScore: "Diese Woche",
    mini: "mini",
    prevWeek: "Vorherige Woche",
    nextWeek: "Nächste Woche",
    theme: "Design wechseln",
    nudge: (person, area, list) => `${person}, ${area} ist diese Woche an dir. Verbleibend: ${list}`,
  },
};

// Rotasyonun başladığı pazartesi
const START = new Date(2026, 8, 14);

/* --------------------------------------------------------------- */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const weekNow = () => Math.floor((Date.now() - START.getTime()) / 604800000);

const rotation = (week) =>
  PEOPLE.map((person, i) => {
    const areaIndex = (((i + week) % 3) + 3) % 3;
    return { person, area: AREAS[areaIndex] };
  });

const weekLabel = (week) => {
  const monday = new Date(START.getTime() + week * 604800000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const f = (d) => `${d.getDate()}.${d.getMonth() + 1}`;
  return `${f(monday)} – ${f(sunday)}`;
};

const keyFor = (week, person, taskId) => `${week}|${person}|${taskId}`;

const timeAgo = (ts, lang) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  const texts = {
    tr: { now: "az önce", m: (n) => `${n} dk önce`, h: (n) => `${n} sa önce`, d: (n) => `${n} gün önce` },
    en: { now: "just now", m: (n) => `${n}m ago`, h: (n) => `${n}h ago`, d: (n) => `${n}d ago` },
    de: { now: "gerade eben", m: (n) => `vor ${n} Min.`, h: (n) => `vor ${n} Std.`, d: (n) => `vor ${n} Tg.` },
  };
  const t = texts[lang];
  if (m < 1) return t.now;
  if (m < 60) return t.m(m);
  const h = Math.floor(m / 60);
  if (h < 24) return t.h(h);
  return t.d(Math.floor(h / 24));
};

const tasksOf = (entry, week, lang) => {
  if (!entry || !entry.area) return [];
  const areaTasks = entry.area.tasks.map((t) => ({
    id: `${entry.area.id}:${t.id}`,
    label: `${entry.area.name[lang]}: ${t.label[lang]}`,
    isMini: false,
  }));
  const miniLabel = entry.area.miniId === "cop" ? trashLabel(week, lang) : MINI[entry.area.miniId][lang];
  return [...areaTasks, { id: `${entry.area.id}:${entry.area.miniId}`, label: miniLabel, isMini: true }];
};

export default function Putzplan() {
  const [week, setWeek] = useState(weekNow());
  const [me, setMe] = useState(PEOPLE[0]);
  const [done, setDone] = useState({});
  const [nudge, setNudge] = useState(null);
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("tr");
  const [totals, setTotals] = useState({});
  const [combos, setCombos] = useState({});

  useEffect(() => {
    const loadTotals = async () => {
      const { data } = await supabase.from("completions").select("person, week");
      const counts = {};
      const streaks = {};
      PEOPLE.forEach((p) => {
        counts[p] = 0;
        streaks[p] = 0;
      });

      const byPersonWeek = {};
      (data || []).forEach((r) => {
        counts[r.person] = (counts[r.person] || 0) + 1;
        const k = `${r.person}|${r.week}`;
        byPersonWeek[k] = (byPersonWeek[k] || 0) + 1;
      });

      const weekAllDone = (person, wk) => {
        const entry = rotation(wk).find((e) => e.person === person);
        if (!entry) return false;
        const total = tasksOf(entry, wk, "tr").length;
        const doneCount = byPersonWeek[`${person}|${wk}`] || 0;
        return total > 0 && doneCount === total;
      };

      // Bonus: o haftayı tam bitiren herkese +2
      Object.keys(byPersonWeek).forEach((k) => {
        const [person, weekStr] = k.split("|");
        if (weekAllDone(person, Number(weekStr))) {
          counts[person] += 2;
        }
      });

      // Combo hesaplama
      PEOPLE.forEach((person) => {
        let streak = 0;
        let wk = weekNow();

        if (!weekAllDone(person, wk)) {
          wk--;
        }

        while (wk >= 0 && weekAllDone(person, wk)) {
          streak++;
          wk--;
        }
        streaks[person] = streak;
      });

      setTotals(counts);
      setCombos(streaks);
    };
    loadTotals();

    const channel = supabase
      .channel("totals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "completions" }, loadTotals)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const t = UI[lang];

  useEffect(() => {
    const savedMe = localStorage.getItem("pp-me");
    if (savedMe && PEOPLE.includes(savedMe)) setMe(savedMe);

    const savedTheme = localStorage.getItem("pp-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    const savedLang = localStorage.getItem("pp-lang");
    if (savedLang && LANGS.includes(savedLang)) setLang(savedLang);
  }, []);

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

  const plan = useMemo(() => rotation(week), [week]);
  const isCurrent = week === weekNow();

  const toggle = async (person, taskId) => {
    const k = keyFor(week, person, taskId);

    setDone((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = { by: me, at: Date.now() };
      return next;
    });

    const wasChecked = done[k];
    if (wasChecked) {
      await supabase.from("completions").delete().eq("week", week).eq("person", person).eq("task", taskId);
    } else {
      await supabase
        .from("completions")
        .upsert({ week, person, task: taskId, checked_by: me }, { onConflict: "week,person,task" });
    }
  };

  const progressOf = (entry) => {
    if (!entry) return { done: 0, total: 0 };
    const all = tasksOf(entry, week, lang);
    return { done: all.filter((x) => done[keyFor(week, entry.person, x.id)]).length, total: all.length };
  };

  const mine = plan.find((p) => p.person === me) || plan[0];
  const others = plan.filter((p) => p.person !== me);
  const myTasks = tasksOf(mine, week, lang);
  const myProgress = progressOf(mine);

  const buildNudge = (entry) => {
    const all = tasksOf(entry, week, lang);
    const missing = all.filter((x) => !done[keyFor(week, entry.person, x.id)]).map((x) => x.label.replace(/^.*: /, ""));
    return t.nudge(entry.person, entry.area.name[lang], missing.join(", "));
  };

  const openWhatsApp = (entry) => {
    const text = encodeURIComponent(buildNudge(entry));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleRemind = async (entry) => {
    const targetPerson = entry.person;
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("subscription")
        .eq("person", targetPerson)
        .maybeSingle();

      if (error || !data) {
        alert(`${targetPerson} henüz bildirim izni vermemiş veya cihazı kayıtlı değil.`);
        return;
      }

      const response = await fetch(
        "https://lglbprmhlwqejwfgpafs.supabase.co/functions/v1/send-push",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            subscription: data.subscription,
            title: "Putz-WG Temizlik Hatırlatması 🧹",
            message: buildNudge(entry),
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert(`${targetPerson} kişisine bildirim gönderildi!`);
      } else {
        alert("Hata: " + result.error);
      }
    } catch (err) {
      console.error("Hatırlatma hatası:", err);
    }
  };

  const subscribeToNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Bu tarayıcı web bildirimlerini desteklemiyor.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Bildirim izni verilmedi.");
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;

      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      const { error } = await supabase.from("subscriptions").upsert(
        { person: me, subscription: sub.toJSON() },
        { onConflict: "person" }
      );

      if (error) {
        alert("Kaydetme hatası: " + error.message);
        return;
      }

      alert(`Bildirimler ${me} için aktif edildi!`);
    } catch (err) {
      console.error("Abonelik hatası:", err);
      alert("Bildirim ayarlanırken hata oluştu: " + err.message);
    }
  };

  return (
    <div className="pp" data-theme={theme}>
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
          --row-hover: #F7FAFB;
          --poke-hover: #FFF8EC;
          background: var(--grout);
          color: var(--ink);
          font-family: 'Archivo', system-ui, sans-serif;
          min-height: 100vh;
          padding: 18px 14px 40px;
          -webkit-font-smoothing: antialiased;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .pp * { box-sizing: border-box; }

        .pp[data-theme="dark"] {
          --grout: #14181b;
          --tile: #1e2327;
          --ink: #e7ecef;
          --muted: #93a1a8;
          --line: #2c3338;
          --blue: #6d94ff;
          --green: #2bcf97;
          --amber: #e6ac4d;
          --row-hover: #262c30;
          --poke-hover: #2a2620;
        }

        .bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 10px; flex-wrap: wrap; }
        .mark {
          font-family: 'Archivo Expanded', 'Archivo', sans-serif;
          font-weight: 700; font-size: 27px; letter-spacing: -0.01em;
        }
        .mark span { color: var(--blue); }

        .bar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .theme-toggle {
          width: 34px; height: 34px; flex: none;
          border: 1px solid var(--line); background: var(--tile); color: var(--ink);
          border-radius: 6px; cursor: pointer; font-size: 16px;
          display: grid; place-items: center;
        }
        .theme-toggle:hover { background: var(--row-hover); }

        .lang-switch { display: flex; gap: 2px; background: var(--line); padding: 3px; border-radius: 6px; }
        .lang-switch button {
          border: none; background: transparent; font: inherit; font-size: 12px; font-weight: 600;
          color: var(--muted); padding: 6px 8px; border-radius: 4px; cursor: pointer;
        }
        .lang-switch button[data-on="1"] { background: var(--tile); color: var(--ink); }

        .weeknav { display: flex; align-items: center; gap: 2px; }
        .weeknav button {
          background: none; border: none; color: var(--muted); font: inherit;
          font-size: 17px; line-height: 1; padding: 6px 8px; cursor: pointer; border-radius: 4px;
        }
        .weeknav button:hover { background: var(--row-hover); color: var(--ink); }
        .weeknav button:disabled { opacity: 0.25; cursor: not-allowed; }
        .weeknav b { font-size: 13px; font-weight: 500; min-width: 86px; text-align: center; color: var(--muted); }

        .leaderboard { background: var(--tile); border: 1px solid var(--line); border-radius: 5px; padding: 14px 16px; margin-bottom: 14px; }
        .leaderboard h2 { margin-bottom: 8px; }
        .leaderboard-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
        .rank { width: 24px; text-align: center; font-weight: 700; }
        .lb-name { flex: 1; font-weight: 600; font-size: 14px; }
        .lb-score { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--blue); }
        .combo { font-size: 12px; font-weight: 700; color: var(--amber); }
        
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
        .fill-track {
          height: 6px;
          background: var(--line);
          border-radius: 99px;
          margin: 0 -18px;
          overflow: hidden;
        }
        .fill-bar {
          height: 100%;
          background: var(--blue);
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        .fill-bar[data-all="1"] {
          background: var(--green);
        }

        .list { background: var(--tile); border: 1px solid var(--line); border-top: none; border-radius: 0 0 5px 5px; margin-bottom: 22px; }
        .row {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 13px 18px; border: none; background: none; font: inherit; text-align: left;
          border-top: 1px solid var(--line); cursor: pointer; color: var(--ink);
        }
        .row:disabled { cursor: default; opacity: 0.6; }
        .row:disabled:hover { background: none; }
        .view-only-banner {
          font-size: 12px; color: var(--amber); background: var(--poke-hover);
          border: 1px solid var(--line); border-radius: 5px; padding: 8px 12px; margin-bottom: 8px;
        }
        .row:hover { background: var(--row-hover); }
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
        .poke:hover { background: var(--poke-hover); }
        .msg-box { margin-top: 10px; background: var(--poke-hover); border: 1px solid var(--line); border-radius: 4px; padding: 10px 12px; }
        .msg { font-size: 13px; line-height: 1.5; color: var(--amber); margin-bottom: 8px; }
        .actions-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .wa-btn {
          border: none; background: #25D366; color: white; font: inherit; font-size: 12px; font-weight: 600;
          padding: 6px 10px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
        }
        .wa-btn:hover { background: #20bd5a; }
        .push-btn {
          border: 1px solid var(--line); background: var(--tile); color: var(--ink); font: inherit; font-size: 12px; font-weight: 600;
          padding: 6px 10px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
        }
        .push-btn:hover { background: var(--row-hover); }

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
        <div className="bar-right">
          <button 
            onClick={subscribeToNotifications}
            className="theme-toggle"
            title="Bildirimleri Aç"
          >
            <Bell className="w-4 h-4 text-amber-500" />
          </button>
          <div className="lang-switch">
            {LANGS.map((l) => (
              <button
                key={l}
                data-on={l === lang ? 1 : 0}
                onClick={() => {
                  setLang(l);
                  localStorage.setItem("pp-lang", l);
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="weeknav">
            <button onClick={() => setWeek((prev) => Math.max(0, prev - 1))} disabled={week <= 0} aria-label={t.prevWeek}>‹</button>
            <b>{isCurrent ? t.thisWeek : weekLabel(week)}</b>
            <button onClick={() => setWeek((prev) => prev + 1)} aria-label={t.nextWeek}>›</button>
          </div>
          <button
            className="theme-toggle"
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              localStorage.setItem("pp-theme", next);
            }}
            aria-label={t.theme}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div className="leaderboard">
        <h2>🏆 {t.leaderboard}</h2>
        <div className="leaderboard-list">
          {Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([person, count], i) => (
              <div className="leaderboard-row" key={person}>
                <span className="rank">{["🥇", "🥈", "🥉"][i] || `${i + 1}.`}</span>
                <span className="lb-name">{person}</span>
                {combos[person] > 0 && <span className="combo">🔥{combos[person]}</span>}
                <span className="lb-score">{count}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="who">
        {PEOPLE.map((p) => (
          <button
            key={p}
            data-on={p === me ? 1 : 0}
            onClick={() => {
              setMe(p);
              localStorage.setItem("pp-me", p);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="hero">
        {!isCurrent && (
          <div className="view-only-banner">{t.viewOnly}</div>
        )}
        <div className="kicker">{isCurrent ? t.yourWeek : t.weekOf(weekLabel(week))}</div>
        <div className="area">{mine?.area?.name[lang]}</div>
        <div className="fill-track">
          <div 
            className="fill-bar" 
            style={{ width: `${myProgress.total > 0 ? (myProgress.done / myProgress.total) * 100 : 0}%` }}
            data-all={myProgress.done === myProgress.total && myProgress.total > 0 ? 1 : 0}
          />
        </div>
      </div>

      <div className="list">
        {myTasks.map((task) => {
          const rec = done[keyFor(week, me, task.id)];
          return (
            <button
              key={task.id}
              className="row"
              data-done={rec ? 1 : 0}
              disabled={!isCurrent}
              onClick={() => isCurrent && toggle(me, task.id)}
            >
              <span className="box">{rec ? "✓" : ""}</span>
              <span className="label">{task.isMini ? task.label : task.label.split(": ")[1]}</span>
              {task.isMini && !rec && <span className="tag">{t.mini}</span>}
              {rec && (
                <span className="stamp">
                  <b>{rec.by}</b>
                  {timeAgo(rec.at, lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h2>{t.homeStatus}</h2>
      {others.map((entry) => {
        const p = progressOf(entry);
        const complete = p.done === p.total && p.total > 0;
        const all = tasksOf(entry, week, lang);
        const missing = all.filter((x) => !done[keyFor(week, entry.person, x.id)]).map((x) => x.label.replace(/^.*: /, ""));
        return (
          <div className="card" key={entry.person}>
            <header>
              <span className="name">{entry.person}</span>
              <span className="sub">{entry.area.name[lang]} · {all.find((x) => x.isMini)?.label}</span>
              <span className="count" data-all={complete ? 1 : 0}>{p.done}/{p.total}</span>
            </header>
            {complete ? (
              <div className="empty">{t.allDone}</div>
            ) : (
              <>
                <div className="empty">{t.remaining(missing.join(", "))}</div>

                {isCurrent && (
                  <button className="poke" onClick={() => setNudge(nudge === entry.person ? null : entry.person)}>
                    {t.remind}
                  </button>
                )}
                {nudge === entry.person && (
                  <div className="msg-box">
                    <div className="msg">{buildNudge(entry)}</div>
                    <div className="actions-group">
                      <button className="wa-btn" onClick={() => openWhatsApp(entry)}>
                        {t.sendWhatsapp}
                      </button>
                      <button className="push-btn" onClick={() => handleRemind(entry)}>
                        {t.sendPush}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <h2 style={{ marginTop: 22 }}>{t.weekScore}</h2>
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