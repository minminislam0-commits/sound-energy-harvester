import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. Create a .env file before using AI.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions:
        "You are AI_CORE, the science-fair assistant for a Class 9 project called " +
        "\"Sound Energy Harvester: Turning Noise into Electricity\". " +
        "Answer clearly and accurately for a Class 9 student. " +
        "Prefer simple English, short explanations, and examples related to the project. " +
        "Explain piezoelectricity, sound waves, voltage, current, bridge rectifiers, capacitors, LEDs, " +
        "energy conversion, and basic circuit ideas when relevant. " +
        "Do not pretend the simulation measurements are real laboratory measurements. " +
        "If asked about unrelated topics, politely say you are focused on this science project.",
      input: message
    });

    res.json({ reply: response.output_text || "AI_CORE returned no text." });
  } catch (error) {
    console.error("AI API error:", error);
    res.status(500).json({
      error: "The AI service could not answer right now."
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Science Fair server running at http://localhost:${PORT}`);
});
