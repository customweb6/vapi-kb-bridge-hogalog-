import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json()); // Essential for reading Vapi tool payload bodies

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

// 1. FOR YOU: When you visit in a web browser, see the raw text instantly
app.get('/api/knowledge/?', async (req, res) => {
  try {
    const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";
    const response = await axios.get(googleDocUrl, { timeout: 4500 });
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(String(response.data));
  } catch (error) {
    console.error("Browser View Error:", error.message);
    return res.status(500).send("Error reading knowledge base details from Google Docs.");
  }
});

// 2. FOR VAPI: This endpoint runs when the Assistant invokes the Custom Tool
app.post('/api/knowledge/?', async (req, res) => {
  try {
    // Safely extract Vapi's unique tool execution ID
    const toolCallId = req.body?.message?.toolCallList?.[0]?.id || "fallback-id";
    console.log(`Received Vapi Tool Call Request. ID: ${toolCallId}`);

    const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";
    const response = await axios.get(googleDocUrl, { timeout: 4500 });
    const rawKnowledgeText = String(response.data);

    // Return the data formatted strictly inside Vapi's expected results schema
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
      results: [
        {
          toolCallId: toolCallId,
          result: "Fehler beim Abrufen der Wissensdatenbank."
        }
      ]
    });
  }
});

// Render automatically injects a PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
