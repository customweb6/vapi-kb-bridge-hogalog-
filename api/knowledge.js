import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json()); // Essential for reading Vapi payload bodies

// Handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// The exact endpoint path Vapi will hit
app.all('/api/knowledge', async (req, res) => {
  try {
    const googleDocUrl = "https://google.com";
    
    // Fetch your client's live google doc
    const response = await axios.get(googleDocUrl);
    const textData = response.data;

    // Grab Vapi's tracking ID
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
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";
    return res.status(200).json({ 
      results: [{ toolCallId, result: "Error reading knowledge base details." }]
    });
  }
});

// Render automatically injects a PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
