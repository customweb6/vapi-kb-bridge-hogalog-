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
