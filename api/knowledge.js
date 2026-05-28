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

// 1. FOR YOU: When you visit in a web browser, this route handles it instantly
app.get('/api/knowledge/?', async (req, res) => {
  try {
    const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";
    const response = await axios.get(googleDocUrl, { timeout: 4500 });
    
    // Serve as explicit plain text so it prints nicely on your screen
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(String(response.data));
  } catch (error) {
    console.error("Browser View Error:", error.message);
    return res.status(500).send("Error reading knowledge base details from Google Docs.");
  }
});

// 2. FOR VAPI: When Vapi sends event data from the Assistant's Server URL
app.post('/api/knowledge/?', async (req, res) => {
  try {
    const messageType = req.body?.message?.type;
    console.log(`Received Vapi Assistant Event: ${messageType}`);

    // If Vapi triggers a call start or requests an assistant mutation patch
    if (!messageType || messageType === 'assistant-request' || messageType === 'call-started') {
      const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";
      const response = await axios.get(googleDocUrl, { timeout: 4500 });
      const rawKnowledgeText = String(response.data);

      const systemInstructionBase = "Du bist ein professioneller, sympathischer KI-Telefonassistent für die HOGALOG AG. Beantworte alle Kundenanfragen präzise, kurz und bündig basierend auf den folgenden offiziellen Systeminformationen:";

      // Send the prompt mutation back to override the current assistant session rules
      return res.status(200).json({
        assistant: {
          model: {
            provider: "openai", 
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `${systemInstructionBase}\n\n[START SYSTEM KNOWLEDGE]\n${rawKnowledgeText}\n[END SYSTEM KNOWLEDGE]`
              }
            ]
          }
        }
      });
    }

    // For any background operational telemetry pings during the call
    return res.status(200).json({ status: "event acknowledged" });
  } catch (error) {
    console.error("Vapi Assistant Webhook Error:", error.message);
    return res.status(200).end();
  }
});

// Render automatically injects a PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
