import { NextRequest, NextResponse } from "next/server";
import { store, addWhatsAppMessage, getWhatsAppMessages } from "@/lib/store";
import { respondToOffer, offerToNextCandidate, completeJob } from "@/lib/engine";

/**
 * WhatsApp Webhook Endpoint for Twilio & Meta Cloud API
 *
 * Supports:
 * - GET: Webhook verification (Meta hub.challenge), message list, & browser test simulation
 * - POST: Incoming WhatsApp message webhook (Twilio Form-urlencoded & Meta JSON)
 */

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  // Meta Webhook Verification handshake
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "jansahayak_webhook_token";
  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  // Fetch chat history for a worker
  const fetchWorkerId = req.nextUrl.searchParams.get("workerId");
  const isList = req.nextUrl.searchParams.get("list");
  if (fetchWorkerId && isList) {
    const messages = getWhatsAppMessages(fetchWorkerId);
    return NextResponse.json({ success: true, messages });
  }

  // Browser interactive test simulation: e.g. /api/webhooks/whatsapp?phone=w-electrician-0&body=1&lang=hi
  const testPhoneOrId = req.nextUrl.searchParams.get("phone") || req.nextUrl.searchParams.get("workerId");
  const testBody = req.nextUrl.searchParams.get("body") || req.nextUrl.searchParams.get("text");
  const langParam = req.nextUrl.searchParams.get("lang") as "en" | "hi" | "ml" | null;

  if (testPhoneOrId && testBody) {
    const result = handleIncomingMessage(testPhoneOrId, testBody, langParam);
    return NextResponse.json(result);
  }

  return NextResponse.json({
    status: "active",
    service: "JanSahayak Cooperative WhatsApp Bot Webhook",
    supportedProviders: ["Meta WhatsApp Cloud API", "Twilio WhatsApp Sandbox"],
    instructions: "POST form data (Twilio: From, Body) or JSON (Meta: messages). Test via GET: ?phone=w-electrician-0&body=1&lang=hi",
  });
}

export async function POST(req: NextRequest) {
  try {
    let from = "";
    let text = "";
    const langParam = req.nextUrl.searchParams.get("lang") as "en" | "hi" | "ml" | null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Meta WhatsApp Cloud API Payload
      const json = await req.json();
      const message = json.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      from = message?.from || "";
      text = message?.text?.body || message?.button?.text || "";
    } else {
      // Twilio WhatsApp Webhook (application/x-www-form-urlencoded)
      const formData = await req.formData();
      from = (formData.get("From") as string) || "";
      text = (formData.get("Body") as string) || "";
    }

    // Clean phone number (e.g. "whatsapp:+919846012345" -> "9846012345")
    const cleanPhone = from.replace("whatsapp:", "").replace(/\D/g, "");

    const reply = handleIncomingMessage(cleanPhone, text, langParam);

    // Return TwiML XML if Twilio request, otherwise JSON
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${reply.replyMessage}</Message>
</Response>`;
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    return NextResponse.json(reply);
  } catch (err) {
    console.error("WhatsApp Webhook Error:", err);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

function handleIncomingMessage(
  senderIdentifier: string,
  messageBody: string,
  explicitLang?: "en" | "hi" | "ml" | null
) {
  const normalizedText = messageBody.trim().toLowerCase();
  const digitsOnly = senderIdentifier.replace(/\D/g, "");

  // Find worker by ID, or phone digits match, or fallback
  const worker =
    store.workers.find((w) => w.id === senderIdentifier) ||
    store.workers.find(
      (w) => w.phone && digitsOnly.length > 5 && w.phone.replace(/\D/g, "").includes(digitsOnly)
    ) ||
    store.workers.find((w) => w.id.includes(senderIdentifier)) ||
    store.workers[0];

  if (!worker) {
    return {
      success: false,
      replyMessage: "JanSahayak Bot: Mobile number not registered with any local cooperative. Visit portal to register.",
    };
  }

  // Determine active language: explicit parameter from navbar > worker preference > default
  if (explicitLang && ["en", "hi", "ml"].includes(explicitLang)) {
    worker.preferredLanguage = explicitLang;
  }
  let lang: "en" | "hi" | "ml" = worker.preferredLanguage || "en";

  // Check if worker directly texted a language switch command in WhatsApp
  if (["hindi", "hi", "हिन्दी"].includes(normalizedText)) {
    worker.preferredLanguage = "hi";
    lang = "hi";
    const reply = "🇮🇳 भाषा हिन्दी में सेट कर दी गई है। अब आपको सभी जनसहायक कॉपरेटिव नोटिफिकेशन हिन्दी में प्राप्त होंगे। 'WALLET' भेजकर बैलेंस देखें।";
    addWhatsAppMessage(worker.id, "worker", messageBody);
    addWhatsAppMessage(worker.id, "bot", reply);
    return { success: true, workerId: worker.id, replyMessage: reply };
  } else if (["malayalam", "ml", "മലയാളം"].includes(normalizedText)) {
    worker.preferredLanguage = "ml";
    lang = "ml";
    const reply = "🇮🇳 ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി. ഇനി ജനസഹായക് സന്ദേശങ്ങൾ മലയാളത്തിൽ ലഭ്യമാകും. 'WALLET' അയച്ച് ബാലൻസ് പരിശോധിക്കാം.";
    addWhatsAppMessage(worker.id, "worker", messageBody);
    addWhatsAppMessage(worker.id, "bot", reply);
    return { success: true, workerId: worker.id, replyMessage: reply };
  } else if (["english", "en"].includes(normalizedText)) {
    worker.preferredLanguage = "en";
    lang = "en";
    const reply = "Language set to English. You will receive all cooperative dispatch alerts in English. Reply 'WALLET' to check balance.";
    addWhatsAppMessage(worker.id, "worker", messageBody);
    addWhatsAppMessage(worker.id, "bot", reply);
    return { success: true, workerId: worker.id, replyMessage: reply };
  }

  // Save the incoming user message to store chat history
  addWhatsAppMessage(worker.id, "worker", messageBody);

  let replyMessage = "";
  let action: string | undefined = undefined;
  let jobId: string | undefined = undefined;

  // 1. Check if worker is querying wallet / status
  if (["balance", "wallet", "3", "paisa", "khata", "ബാലൻസ്", "बैलेंस"].includes(normalizedText)) {
    if (lang === "hi") {
      replyMessage = `💼 *जनसहायक सहकारी वॉलेट*\n\nश्रमिक सदस्य: ${worker.name}\nकॉपरेटिव बैलेंस: *₹${worker.walletBalance.toFixed(2)}*\nकाम पूरे किए: ${worker.completedJobs}\nस्थिति: ${worker.upskilling ? "एनसीसीटी अपस्किलिंग" : "सक्रिय सदस्य"}\n\nकल्याणकारी स्वास्थ्य कोष: 1.5% स्वतः जमा।`;
    } else if (lang === "ml") {
      replyMessage = `💼 *ജനസഹായക് സഹകരണ വാലറ്റ്*\n\nതൊഴിലാളി: ${worker.name}\nവാലറ്റ് ബാലൻസ്: *₹${worker.walletBalance.toFixed(2)}*\nചെയ്ത ജോലികൾ: ${worker.completedJobs}\nസ്റ്റാറ്റസ്: ${worker.upskilling ? "എൻസിസിടി അപ്‌സ്‌കില്ലിംഗ്" : "സജീവ അംഗം"}\n\nസഹകരണ ക്ഷേമനിധി: 1.5% നിക്ഷേപം സജീവം.`;
    } else {
      replyMessage = `💼 *JanSahayak Cooperative Wallet*\n\nWorker: ${worker.name}\nCoop Balance: *₹${worker.walletBalance.toFixed(2)}*\nJobs Done: ${worker.completedJobs}\nStatus: ${worker.upskilling ? "NCCT Upskilling" : "Active Member"}\n\nCoop Welfare Fee: 1.5% micro-pooling active.`;
    }
  }
  // 2. Check if worker is completing an active assignment
  else if (["done", "complete", "completed", "khatam", "finish", "समाप्त", "തീർന്നു"].includes(normalizedText)) {
    const activeJob = store.jobs.find(
      (j) => j.assignedWorkerId === worker.id && j.status === "accepted"
    );

    if (activeJob) {
      completeJob(activeJob.id);
      action = "completed";
      jobId = activeJob.id;

      if (lang === "hi") {
        replyMessage = `🎉 *सेवा सफलतापूर्वक संपन्न!*\n\nकाम: ${activeJob.categoryId.toUpperCase()}\nफिक्स्ड दर: ₹${activeJob.amount}\n\n₹${(activeJob.amount * 0.985).toFixed(2)} आपके सहकारी वॉलेट में जमा कर दिए गए हैं।\n₹${(activeJob.amount * 0.015).toFixed(2)} सहकारी स्वास्थ्य कल्याण कोष में जोड़े गए।\n\nनया बैलेंस: ₹${worker.walletBalance.toFixed(2)}।`;
      } else if (lang === "ml") {
        replyMessage = `🎉 *സേവനം വിജയകരമായി പൂർത്തിയായി!*\n\nജോലി: ${activeJob.categoryId.toUpperCase()}\nനിരക്ക്: ₹${activeJob.amount}\n\n₹${(activeJob.amount * 0.985).toFixed(2)} നിങ്ങളുടെ സഹകരണ വാലറ്റിൽ ക്രെഡിറ്റ് ചെയ്തു.\n₹${(activeJob.amount * 0.015).toFixed(2)} സഹകരണ ക്ഷേമനിധിയിലേക്ക് മാറ്റി.\n\nപുതിയ ബാലൻസ്: ₹${worker.walletBalance.toFixed(2)}.`;
      } else {
        replyMessage = `🎉 *SERVICE COMPLETED!*\n\nJob: ${activeJob.categoryId.toUpperCase()}\nFixed Rate: ₹${activeJob.amount}\n\n₹${(activeJob.amount * 0.985).toFixed(2)} deposited into your cooperative wallet.\n₹${(activeJob.amount * 0.015).toFixed(2)} routed to Cooperative Health Fund.\n\nNew balance: ₹${worker.walletBalance.toFixed(2)}. Stand by for next rotational match!`;
      }
    } else {
      replyMessage =
        lang === "hi"
          ? `वर्तमान में कोई सक्रिय काम नहीं है। बैलेंस देखने के लिए 'WALLET' भेजें।`
          : lang === "ml"
          ? `നിലവിൽ പൂർത്തിയാക്കാൻ സജീവ ജോലികളില്ല. 'WALLET' അയച്ച് ബാലൻസ് പരിശോധിക്കുക.`
          : `You have no active in-progress job to mark as completed. Reply 'WALLET' to check balance.`;
    }
  }
  // 3. Check for pending offer
  else {
    const pendingJob = store.jobs.find(
      (j) => j.currentOfferWorkerId === worker.id && j.status === "offered"
    );

    if (!pendingJob) {
      if (lang === "hi") {
        replyMessage = `नमस्ते ${worker.name}! इस समय कोई काम प्रतीक्षारत नहीं है। रोटेशनल इक्विटी कतार में आपकी बारी आते ही स्वचालित संदेश मिलेगा। बैलेंस देखने के लिए 'WALLET' भेजें।`;
      } else if (lang === "ml") {
        replyMessage = `നമസ്കാരം ${worker.name}! ഇപ്പോൾ പുതിയ ജോലി ഓഫറുകൾ ഇല്ല. റൊട്ടേഷണൽ ക്യൂവിൽ നിങ്ങളുടെ ഊഴം വരുമ്പോൾ അറിയിപ്പ് ലഭിക്കും. 'WALLET' അയച്ച് ബാലൻസ് പരിശോധിക്കാം.`;
      } else {
        replyMessage = `Namaste ${worker.name}! No pending job offers right now. You will receive an automated WhatsApp prompt when your turn in the rotational equity queue arrives. Reply 'WALLET' to check balance.`;
      }
    }
    // Handle Accept ("1", "yes", "accept", "haan", "sweekar", "ok", "ശരി")
    else if (["1", "yes", "accept", "haan", "sweekar", "ok", "ശരി", "സ്വീകരിച്ചു"].includes(normalizedText)) {
      respondToOffer(pendingJob.id, worker.id, true);
      action = "accepted";
      jobId = pendingJob.id;

      if (lang === "hi") {
        replyMessage = `✅ *काम स्वीकार किया गया!*\n\nबुकिंग: ${pendingJob.categoryId.toUpperCase()}\nदर: ₹${pendingJob.amount} (फिक्स्ड)\nग्राहक: राहुल\nक्लस्टर: कोच्चि, केरल\n\nफिक्स्ड भुगतान: ₹${(pendingJob.amount * 0.985).toFixed(2)} काम पूरा होने पर आपके वॉलेट में जमा होगा।\n1.5% (₹${(pendingJob.amount * 0.015).toFixed(2)}) स्वतः स्वास्थ्य कोष में जाएगा।\n\nकाम पूरा होने पर *'DONE'* भेजें।`;
      } else if (lang === "ml") {
        replyMessage = `✅ *ജോലി സ്വീകരിച്ചു!*\n\nവിഭാഗം: ${pendingJob.categoryId.toUpperCase()}\nനിരക്ക്: ₹${pendingJob.amount} (സ്ഥിരം നിരക്ക്)\nഉപഭോക്താവ്: രാഹുൽ\nക്ലസ്റ്റർ: കൊച്ചി, കേരളം\n\nതുക ₹${(pendingJob.amount * 0.985).toFixed(2)} ജോലി പൂർത്തിയാകുമ്പോൾ വാലറ്റിൽ ലഭിക്കും.\n1.5% ക്ഷേമനിധിയിലേക്ക് മാറ്റും.\n\nപൂർത്തിയാകുമ്പോൾ *'DONE'* അയക്കുക.`;
      } else {
        replyMessage = `✅ *JOB ACCEPTED!*\n\nBooking: ${pendingJob.categoryId.toUpperCase()}\nRate Card: ₹${pendingJob.amount} (Fixed)\nConsumer: Rahul\nCluster: Kochi, Kerala\n\nFixed Payout: ₹${(pendingJob.amount * 0.985).toFixed(2)} will be deposited in your wallet upon completion.\n1.5% (₹${(pendingJob.amount * 0.015).toFixed(2)}) auto-deposited to Cooperative Health Fund.\n\nReply *'DONE'* when service is completed.`;
      }
    }
    // Handle Decline ("2", "no", "decline", "nahi")
    else if (["2", "no", "decline", "nahi", "reject", "मना", "നിരസിച്ചു"].includes(normalizedText)) {
      respondToOffer(pendingJob.id, worker.id, false);
      const consumer = store.consumers.find((c) => c.id === pendingJob.consumerId) || store.consumers[0];
      offerToNextCandidate(pendingJob.id, consumer);
      action = "declined";
      jobId = pendingJob.id;

      if (lang === "hi") {
        replyMessage = `ऑफर अस्वीकार किया गया। जनसहायक रोटेशनल इक्विटी इंजन ने यह काम अगले पात्र कॉपरेटिव साथी को भेज दिया है। आप कतार में सक्रिय रहेंगे।`;
      } else if (lang === "ml") {
        replyMessage = `ഓഫർ നിരസിച്ചു. അടുത്ത സഹകരണ തൊഴിലാളിക്ക് റൊട്ടേഷണൽ മുൻഗണന പ്രകാരം ജോലി കൈമാറി. താങ്കൾ ക്യൂവിൽ സജീവമായി തുടരുന്നു.`;
      } else {
        replyMessage = `Offer declined. JanSahayak's rotational equity engine has routed the job to the next eligible candidate. You remain active in the queue.`;
      }
    }
    // Fallback instructions
    else {
      if (lang === "hi") {
        replyMessage = `जनसहायक बॉट:\nनया काम उपलब्ध: ${pendingJob.categoryId.toUpperCase()} (₹${pendingJob.amount})।\n\nमैसेज भेजें:\n👉 *1* स्वीकार करने के लिए\n👉 *2* मना करने के लिए\n👉 *WALLET* बैलेंस के लिए`;
      } else if (lang === "ml") {
        replyMessage = `ജനസഹായക് ബോട്ട്:\nപുതിയ ജോലി: ${pendingJob.categoryId.toUpperCase()} (₹${pendingJob.amount}).\n\nമറുപടി നൽകുക:\n👉 *1* സ്വീകരിക്കാൻ\n👉 *2* നിരസിക്കാൻ\n👉 *WALLET* ബാലൻസ് അറിയാൻ`;
      } else {
        replyMessage = `JanSahayak Bot:\nNew job pending: ${pendingJob.categoryId.toUpperCase()} (₹${pendingJob.amount}).\n\nReply:\n👉 *1* to Accept\n👉 *2* to Decline\n👉 *WALLET* for balance`;
      }
    }
  }

  // Save the bot reply to store chat history
  addWhatsAppMessage(worker.id, "bot", replyMessage);

  return {
    success: true,
    action,
    jobId,
    workerId: worker.id,
    language: lang,
    replyMessage,
  };
}
