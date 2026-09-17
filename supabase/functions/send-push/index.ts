// @ts-nocheck
import { sendNotification } from "npm:web-push-neo"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscription, title, message } = await req.json()

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "subscription eksik" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const vapidDetails = {
      subject: 'mailto:test@example.com',
      publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || '',
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || '',
    }

    const payload = JSON.stringify({
      title: title || "Putz-WG",
      body: message || "Yeni bir bildiriminiz var!",
      url: "/",
    })

    const result = await sendNotification(subscription, payload, { vapidDetails })

    return new Response(
      JSON.stringify({ success: true, statusCode: result.statusCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error("send-push error:", error)
    return new Response(
      JSON.stringify({ error: error.message || String(error), details: error.body || null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})