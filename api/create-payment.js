import crypto from "crypto";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const API_TOKEN = process.env.API_TOKEN;
    const API_SECRET = process.env.API_SECRET;
    const API_KEY = process.env.API_KEY;
    const CALLBACK_URL = process.env.CALLBACK_URL;
    const ACQUIRER_CODE = process.env.ACQUIRER_CODE || "adquirente1";

    if (!API_TOKEN) {
      return res.status(500).json({ ok: false, error: "API_TOKEN não configurado" });
    }

    if (!API_SECRET) {
      return res.status(500).json({ ok: false, error: "API_SECRET não configurado" });
    }

    if (!CALLBACK_URL) {
      return res.status(500).json({ ok: false, error: "CALLBACK_URL não configurado" });
    }

    const payload = {
      amount: 25.99,
      callbackUrl: CALLBACK_URL,
      externalId: `order_${Date.now()}`,
      acquirer_code: ACQUIRER_CODE
    };

    const body = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString();

    const sig = crypto
      .createHmac("sha256", API_SECRET)
      .update(`${ts}.${body}`)
      .digest("hex");

    const headers = {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      "X-C7-Timestamp": ts,
      "X-C7-Signature": sig
    };

    if (API_KEY) {
      headers["X-API-KEY"] = API_KEY;
    }

    const response = await fetch("https://api.carteirado7.com/v2/payment/create", {
      method: "POST",
      headers,
      body
    });

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: false, error: text || "Resposta inválida da API" };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Erro interno no servidor"
    });
  }
}
