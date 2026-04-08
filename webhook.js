import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-signature, x-request-id");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // --- Validação de assinatura (recomendado pelo Mercado Pago) ---
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (secret) {
      const xSignature = req.headers["x-signature"] ?? "";
      const xRequestId  = req.headers["x-request-id"] ?? "";
      const dataId      = req.query?.["data.id"] ?? req.body?.data?.id ?? "";

      // Monta o manifest: "id:<dataId>;request-id:<xRequestId>;"
      const manifest = `id:${dataId};request-id:${xRequestId};`;
      const parts    = xSignature.split(",");
      let ts = "", v1 = "";
      parts.forEach(p => {
        const [k, v] = p.trim().split("=");
        if (k === "ts") ts = v;
        if (k === "v1") v1 = v;
      });

      const signedTemplate = `ts:${ts};${manifest}`;
      const expected = crypto
        .createHmac("sha256", secret)
        .update(signedTemplate)
        .digest("hex");

      if (expected !== v1) {
        console.warn("Webhook: assinatura inválida");
        return res.status(401).json({ ok: false, error: "Invalid signature" });
      }
    }
    // --- fim validação ---

    const { type, data } = req.body ?? {};

    // Só processa notificações de pagamento
    if (type !== "payment") {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Consulta o pagamento no MP para obter o status real
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpRes.json();

    console.log(
      `Webhook payment ${paymentId}: status=${payment.status} detail=${payment.status_detail}`
    );

    // ---------------------------------------------------------------
    // AQUI: coloque sua lógica de negócio para pagamentos aprovados
    // Exemplo:
    //   if (payment.status === "approved") {
    //     await liberarAcesso(payment.payer.email);
    //   }
    // ---------------------------------------------------------------

    return res.status(200).json({ ok: true, status: payment.status });
  } catch (err) {
    console.error("webhook error:", err);
    // Retorna 200 mesmo em erro para o MP não retentar infinitamente
    return res.status(200).json({ ok: false, error: err.message });
  }
}
