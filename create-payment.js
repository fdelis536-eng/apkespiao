import crypto from "crypto";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email = "cliente@email.com", name = "Cliente" } = req.body ?? {};

  try {
    const idempotencyKey = crypto.randomUUID();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: 25.99,
        description: "Localize Pro — Acesso Mensal",
        payment_method_id: "pix",
        payer: {
          email,
          first_name: name.split(" ")[0] || "Cliente",
          last_name: name.split(" ").slice(1).join(" ") || "Pro",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP error:", JSON.stringify(data));
      return res.status(502).json({ ok: false, error: data });
    }

    const txData = data?.point_of_interaction?.transaction_data;

    return res.status(200).json({
      ok: true,
      paymentId: data.id,
      pixCopiaECola: txData?.qr_code ?? null,
      qrCodeBase64: txData?.qr_code_base64 ?? null,
    });
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
