// @ts-nocheck
import { sendNotification } from "npm:web-push-neo"
import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

/* ---------------------------------------------------------------
   names, areas, tasks, and other constants are hardcoded here for simplicity.
   --------------------------------------------------------------- */

const PEOPLE = ["Emirhan", "Baran", "Ege"]

const AREAS = [
  {
    id: "koridor",
    name: "Koridor",
    tasks: [
      { id: "supurge", label: "Süpürge" },
      { id: "vileda", label: "Vileda" },
      { id: "kuvet", label: "Küvet Temizliği" },
      { id: "bulasikmakinesi", label: "Bulaşık makinesi" },
    ],
    miniId: "cop",
  },
  {
    id: "banyo",
    name: "Banyo",
    tasks: [
      { id: "lavabo", label: "Lavabo & Ayna" },
      { id: "klozet", label: "Klozet" },
      { id: "supurge", label: "Süpürge" },
      { id: "vileda", label: "Vileda" },
    ],
    miniId: "market",
  },
  {
    id: "mutfak",
    name: "Mutfak",
    tasks: [
      { id: "tezgah", label: "Tezgah" },
      { id: "ocak", label: "Ocak" },
      { id: "bulasikmakinesi", label: "Bulaşık makinesi" },
      { id: "supurge", label: "Süpürge" },
      { id: "vileda", label: "Vileda" },
    ],
    miniId: "masa",
  },
]

const MINI = {
  market: "Ortak market",
  masa: "Mutfak Masası",
}

const START = new Date(2026, 8, 14)

const weekNow = () => Math.floor((Date.now() - START.getTime()) / 604800000)

const trashLabel = (week) => {
  const even = Math.abs(week) % 2 === 0
  return even ? "Çöp ( Restmüll )" : "Çöp ( Gelbe / Pappe )"
}

const areaForPerson = (week, personIndex) => {
  const areaIndex = (((personIndex + week) % 3) + 3) % 3
  return AREAS[areaIndex]
}

const tasksOf = (area, week) => {
  const areaTasks = area.tasks.map((t) => ({
    id: `${area.id}:${t.id}`,
    label: `${area.name}: ${t.label}`,
  }))
  const miniLabel = area.miniId === "cop" ? trashLabel(week) : MINI[area.miniId]
  return [...areaTasks, { id: `${area.id}:${area.miniId}`, label: miniLabel }]
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const week = weekNow()

    // Retrieve all of this week's completion records at once
    const { data: completions } = await supabase
      .from("completions")
      .select("person, task")
      .eq("week", week)

    const doneSet = new Set((completions || []).map((c) => `${c.person}|${c.task}`))

    const results = []

    for (let i = 0; i < PEOPLE.length; i++) {
      const person = PEOPLE[i]
      const area = areaForPerson(week, i)
      const tasks = tasksOf(area, week)
      const missing = tasks.filter((t) => !doneSet.has(`${person}|${t.id}`))

      if (missing.length === 0) {
        results.push({ person, status: "skipped-all-done" })
        continue
      }

      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("subscription")
        .eq("person", person)
        .maybeSingle()

      if (!subRow) {
        results.push({ person, status: "no-subscription" })
        continue
      }

      const missingLabels = missing.map((t) => t.label.replace(/^.*: /, "")).join(", ")
      const payload = JSON.stringify({
        title: "Bugün temizlik vakti 🧹",
        body: `${person}, bu hafta ${area.name} sende. Kalanlar: ${missingLabels}`,
        url: "/",
      })

      const vapidDetails = {
        subject: "mailto:test@example.com",
        publicKey: Deno.env.get("VAPID_PUBLIC_KEY") || "",
        privateKey: Deno.env.get("VAPID_PRIVATE_KEY") || "",
      }

      try {
        await sendNotification(subRow.subscription, payload, { vapidDetails })
        results.push({ person, status: "sent", missing: missingLabels })
      } catch (err) {
        results.push({ person, status: "error", error: err.message })
      }
    }

    return new Response(JSON.stringify({ week, results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: any) {
    console.error("daily-reminder error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})