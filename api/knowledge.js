import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json()); // Essential for reading Vapi webhook payload bodies

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

// Root path diagnostic route to verify web deployment quickly
app.get('/', (req, res) => {
  res.status(200).send("Vapi Knowledge Bridge is running smoothly.");
});

// The exact endpoint path Vapi hits as its main Server URL
app.all('/api/knowledge/?', async (req, res) => {
  try {
    // Extract Vapi's standard webhook payload structure
    const messageType = req.body?.message?.type;
    console.log(`Received Vapi Event Notification: ${messageType}`);

    // If Vapi is querying your server for dynamic assistant context
    if (messageType === 'assistant-request') {
      const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";
      
      // Fetch the raw text dump from your Google Doc
      const response = await axios.get(googleDocUrl, { timeout: 4500 });
      const rawKnowledgeText = String(response.data);

      // Define your foundational agent personality instructions
      const systemInstructionBase = "Du bist ein professioneller, sympathischer KI-Telefonassistent für die HOGALOG AG. Beantworte alle Kundenanfragen präzise, kurz und bündig basierend auf den folgenden offiziellen Systeminformationen:";

      // Return a mutating message configuration payload directly back to Vapi's execution pool
      return res.status(200).json({
        assistant: {
          model: {
            provider: "openai", // Update provider matching your dashboard strategy (e.g., "together-ai", "groq")
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

    // For status updates, speech-updates, or transcript tokens, return a standard 200 OK block
    return res.status(200).json({ status: "event acknowledged" });

  } catch (error) {
    console.error("Server URL Routing Error:", error.message);
    
    // Fallback quietly so a minor network failure during deployment lookup never intentionally terminates the call pipeline
    return res.status(200).end();
  }
});

// Render automatically injects a PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
