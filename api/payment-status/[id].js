export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing payment id" });
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("MP status error:", JSON.stringify(data));
      return res.status(502).json({ ok: false, error: data });
    }

    return res.status(200).json({
      ok: true,
      status: data.status,
      statusDetail: data.status_detail,
    });
  } catch (err) {
    console.error("payment-status error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
