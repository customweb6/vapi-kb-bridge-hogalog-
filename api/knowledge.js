import axios from 'axios';

export default async function handler(req, res) {
  // Set explicit headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const googleDocUrl = "https://google.com";
    
    // Axios safely downloads the text stream where native fetch fails
    const response = await axios.get(googleDocUrl);
    const textData = response.data;

    // Pull the Vapi tracking ID
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";

    return res.status(200).json({
      results: [
        {
          toolCallId: toolCallId,
          result: String(textData)
        }
      ]
    });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ 
      results: [
        {
          toolCallId: req.body?.message?.toolCallList?.[0]?.id || "fallback-id",
          result: "Error reading knowledge base details."
        }
      ]
    });
  }
}
