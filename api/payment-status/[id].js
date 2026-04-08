export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { id } = req.query;
    const API_TOKEN = process.env.API_TOKEN;

    if (!API_TOKEN) {
      return res.status(500).json({ ok: false, error: "API_TOKEN não configurado" });
    }

    const response = await fetch(`https://api.carteirado7.com/v2/payment/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      }
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