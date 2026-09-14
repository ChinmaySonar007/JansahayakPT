import { store, addWhatsAppMessage } from "./store";
import type { Worker, Job } from "./types";

/**
 * JanSahayak WhatsApp Bot Service
 * Supports:
 * 1. Live In-Memory Simulation for SIH judges/demo (Zero external credentials required)
 * 2. Twilio WhatsApp Sandbox (Free 3-minute setup for real WhatsApp messages)
 * 3. Meta WhatsApp Cloud API (Production official business API)
 */

export interface SendWhatsAppParams {
  workerId: string;
  text: string;
  jobId?: string;
}

export async function sendWhatsAppNotification(params: SendWhatsAppParams): Promise<{
  success: boolean;
  provider: "simulation" | "twilio" | "meta";
  messageId: string;
}> {
  const { workerId, text } = params;
  const worker = store.workers.find((w) => w.id === workerId);

  // 1. Record into store for real-time frontend chat display
  const storedMsg = addWhatsAppMessage(workerId, "bot", text);

  // 2. Check for Twilio WhatsApp Credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Twilio Sandbox standard number

  if (twilioSid && twilioToken && worker?.phone) {
    try {
      const cleanPhone = worker.phone.replace(/\s+/g, "");
      const to = cleanPhone.startsWith("+") ? `whatsapp:${cleanPhone}` : `whatsapp:+91${cleanPhone}`;

      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: to,
          Body: text,
        }).toString(),
      });

      if (res.ok) {
        return { success: true, provider: "twilio", messageId: storedMsg.id };
      }
    } catch (e) {
      console.warn("Twilio WhatsApp dispatch fallback to simulated store:", e);
    }
  }

  // 3. Check for Meta WhatsApp Cloud API Credentials
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId && worker?.phone) {
    try {
      const recipientPhone = worker.phone.replace(/\D/g, "");
      const res = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });

      if (res.ok) {
        return { success: true, provider: "meta", messageId: storedMsg.id };
      }
    } catch (e) {
      console.warn("Meta WhatsApp Cloud API fallback to simulated store:", e);
    }
  }

  // Default: Instant simulation (active in hackathon showcase)
  return { success: true, provider: "simulation", messageId: storedMsg.id };
}

/**
 * Trigger automated dispatch prompt when rotational engine matches a worker
 */
export function triggerJobOfferWhatsApp(job: Job, worker: Worker) {
  const lang = worker.preferredLanguage || "en";
  let message = "";

  if (lang === "hi") {
    message = `🔔 *जनसहायक सहकारी मंच - नया काम*\n\nनमस्ते ${worker.name}! आपके क्लस्टर में नया काम आया है:\n\n🛠 *काम*: ${job.categoryId.toUpperCase()}\n📍 *स्थान*: ${worker.areaLabel}\n💰 *फिक्स्ड दर*: ₹${job.amount}\n🛡 *श्रमिक भुगतान*: ₹${(job.amount * 0.985).toFixed(2)} (98.5% सीधा आपको)\n🏥 *स्वास्थ्य निधि*: ₹${(job.amount * 0.015).toFixed(2)} (1.5% कॉपरेटिव फंड)\n\nमैसेज भेजें:\n👉 *1* काम *स्वीकार* करने के लिए\n👉 *2* *मना* करने के लिए (अगले साथी को जाएगा)\n👉 *WALLET* बैलेंस चेक करने के लिए`;
  } else if (lang === "ml") {
    message = `🔔 *ജനസഹായക് സഹകരണ സന്ദേശം*\n\nനമസ്കാരം ${worker.name}! നിങ്ങളുടെ പ്രദേശത്ത് പുതിയ ജോലി ലഭ്യമാണ്:\n\n🛠 *വിഭാഗം*: ${job.categoryId.toUpperCase()}\n📍 *ക്ലസ്റ്റർ*: ${worker.areaLabel}\n💰 *സ്ഥിര നിരക്ക്*: ₹${job.amount}\n🛡 *തൊഴിലാളി വിഹിതം*: ₹${(job.amount * 0.985).toFixed(2)} (98.5% നേരിട്ട്)\n🏥 *ക്ഷേമനിധി*: ₹${(job.amount * 0.015).toFixed(2)} (1.5% പൂളിംഗ്)\n\nമറുപടി നൽകുക:\n👉 *1* ജോലി *സ്വീകരിക്കാൻ*\n👉 *2* *നിരസിക്കാൻ* (അടുത്ത അംഗത്തിന് ലഭിക്കും)\n👉 *WALLET* ബാലൻസ് പരിശോധിക്കാൻ`;
  } else {
    message = `🔔 *JANSAHAYAK COOPERATIVE DISPATCH*\n\nNamaste ${worker.name}! New gig job available in your area:\n\n🛠 *Trade*: ${job.categoryId.toUpperCase()}\n📍 *Cluster*: ${worker.areaLabel}\n💰 *Fixed Rate Card*: ₹${job.amount}\n🛡 *Coop Payout*: ₹${(job.amount * 0.985).toFixed(2)} (98.5% direct)\n🏥 *Welfare Fund*: ₹${(job.amount * 0.015).toFixed(2)} (1.5% pooled)\n\nReply:\n👉 *1* to *ACCEPT* Job\n👉 *2* to *DECLINE* (routes to next coop member)\n👉 *WALLET* to check cooperative balance`;
  }

  return sendWhatsAppNotification({
    workerId: worker.id,
    text: message,
    jobId: job.id,
  });
}
