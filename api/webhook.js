export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    console.log("Webhook recebido:", req.body);

    return res.status(200).json({
      ok: true,
      message: "Webhook recebido com sucesso"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}