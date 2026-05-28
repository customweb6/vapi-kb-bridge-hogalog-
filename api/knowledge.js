// The exact endpoint path Vapi hits as its main Server URL
app.all('/api/knowledge/?', async (req, res) => {
  try {
    const googleDocUrl = "https://docs.google.com/document/d/1ExIzCzcivt3Gi7xrDd3W8ik3mz_fkC30oddpG7R3kPw/export?format=txt";

    // 1. FOR YOU: If you open this in a web browser (GET request), show the raw text immediately
    if (req.method === 'GET') {
      const response = await axios.get(googleDocUrl, { timeout: 4500 });
      
      // Set the content type to plain text so it looks neat in your browser
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(String(response.data));
    }

    // 2. FOR VAPI: If Vapi hits the endpoint via a POST webhook request
    const messageType = req.body?.message?.type;
    console.log(`Received Vapi Event Notification: ${messageType}`);

    if (messageType === 'assistant-request' || messageType === 'assistant.request') {
      const response = await axios.get(googleDocUrl, { timeout: 4500 });
      const rawKnowledgeText = String(response.data);

      const systemInstructionBase = "Du bist ein professioneller, sympathischer KI-Telefonassistent für die HOGALOG AG. Beantworte alle Kundenanfragen präzise, kurz und bündig basierend auf den folgenden offiziellen Systeminformationen:";

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

    // For all other background Vapi event webhooks
    return res.status(200).json({ status: "event acknowledged" });

  } catch (error) {
    console.error("Routing Error:", error.message);
    
    // Fallback if browser test or Vapi check fails
    if (req.method === 'GET') {
      return res.status(500).send("Error reading knowledge base details from Google Docs.");
    }
    return res.status(200).end();
  }
});
