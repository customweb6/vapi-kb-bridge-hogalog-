import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

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

// A central registry mapping URL keywords to their respective Google Doc links
const documentRegistry = {
  'hogalog': 'https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt',
  'julius-products': 'https://docs.google.com/document/d/1P_OSy_p6i6EFBmawiUl8Kxmcgqv6BJjkc0KxFQJ1OBQ/export?format=txt'
};

// 1. FOR YOU: Dynamic browser link check (e.g., /api/knowledge/hogalog)
app.get('/api/knowledge/:client', async (req, res) => {
  try {
    const clientKey = req.params.client?.toLowerCase();
    const googleDocUrl = documentRegistry[clientKey];

    if (!googleDocUrl) {
      return res.status(404).send(`Client key "${req.params.client}" not found in registry.`);
    }

    const response = await axios.get(googleDocUrl, { timeout: 4500 });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(String(response.data));
  } catch (error) {
    console.error("Browser View Error:", error.message);
    return res.status(500).send("Error reading details from the requested Google Doc.");
  }
});

// 2. FOR VAPI: Dynamic Custom Tool route
app.post('/api/knowledge/:client', async (req, res) => {
  try {
    const clientKey = req.params.client?.toLowerCase();
    const googleDocUrl = documentRegistry[clientKey];
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";

    console.log(`Received Vapi Tool Call Request for [${clientKey}]. ID: ${toolCallId}`);

    if (!googleDocUrl) {
      console.error(`Unknown client key requested: ${clientKey}`);
      return res.status(200).json({
        results: [{ toolCallId, result: "Fehler: Unbekannter Mandant in der Konfiguration." }]
      });
    }

    const response = await axios.get(googleDocUrl, { timeout: 4500 });
    const rawKnowledgeText = String(response.data);

    return res.status(200).json({
      results: [
        {
          toolCallId: toolCallId,
          result: rawKnowledgeText
        }
      ]
    });
  } catch (error) {
    console.error("Vapi Tool Execution Error:", error.message);
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";
    
    return res.status(200).json({
      results: [{ toolCallId, result: "Fehler beim Abrufen der Wissensdatenbank." }]
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Multi-tenant knowledge base server running on port ${PORT}`);
});
