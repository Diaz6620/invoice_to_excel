// Recibe { mediaType, data(base64) } y devuelve los datos de la factura en JSON.
const PROMPT = `Extrae los datos de esta factura. Responde SOLO con un objeto JSON, sin texto ni backticks:
{"numero":"","proveedor":"","fecha":"DD/MM/AAAA","base":0,"iva":0,"total":0}
- base, iva y total son números con punto decimal (sin símbolo de moneda).
- iva es el importe del impuesto, no el porcentaje.
- proveedor es quien emite la factura.
- Si un dato no aparece, usa "" (texto) o null (número).`;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: "Falta ANTHROPIC_API_KEY en Netlify" });

  let mediaType, data;
  try { ({ mediaType, data } = JSON.parse(event.body)); }
  catch { return json(400, { error: "Petición no válida" }); }

  const isPdf = mediaType === "application/pdf";
  const isImg = ["image/jpeg", "image/png", "image/webp"].includes(mediaType);
  if (!data || (!isPdf && !isImg)) return json(400, { error: "Formato no admitido. Usa PDF, JPG o PNG." });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            { type: isPdf ? "document" : "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });
    const out = await res.json();
    if (!res.ok) return json(502, { error: out.error?.message || "Error del servicio de IA" });

    const text = (out.content || []).map((b) => b.text || "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json(502, { error: "No se pudo leer la factura" });
    return json(200, JSON.parse(match[0]));
  } catch (e) {
    return json(500, { error: "No se pudo procesar la factura" });
  }
};
