export default async function handler(req, res) {
  // Always respond to preflight verification requests from Vapi
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch your client's live Google Doc plain text link instantly
    const googleDocUrl = "https://docs.google.com/document/d/e/2PACX-1vQnd4oBx9WeyogFXg-naCs1oRaYTldFdf4h7HTf785_eN5i-J_7_iPspqwgu3d8O76zhyGRMe5Qn3A2/pub?format=txt";
    const response = await fetch(googleDocUrl);
    
    if (!response.ok) {
      throw new Error(`Google Docs fetched with status: ${response.status}`);
    }
    
    const textData = await response.text();

    // 2. Extract Vapi's unique tool tracking ID from the incoming request payload safely
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";

    // 3. Return the exact JSON structure Vapi's server mechanically requires
    return res.status(200).json({
      results: [
        {
          toolCallId: toolCallId,
          result: textData
        }
      ]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to read knowledge base document" });
  }
}
