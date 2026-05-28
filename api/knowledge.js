export default async function handler(req, res) {
  // Fix CORS preflight options issues immediately
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    const googleDocUrl = "https://google.com";
    const response = await fetch(googleDocUrl);
    const textData = await response.text();

    // Safely look up the Vapi block execution ID
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";

    // Format the response structure Vapi requires
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      results: [
        {
          toolCallId: toolCallId,
          result: textData
        }
      ]
    });
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: "Failed to read knowledge base document" });
  }
}
