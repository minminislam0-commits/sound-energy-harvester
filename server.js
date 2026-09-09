import express from "express";
import { GoogleGenAI } from "google-genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set. Create a .env file before using AI.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// AI Chat Route (Free Gemini API)
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction:
          "You are AI_CORE, the science-fair assistant for a Class 9 project called " +
          "\"Sound Energy Harvester: Turning Noise into Electricity\". " +
          "Answer clearly and accurately for a Class 9 student. " +
          "Prefer simple English, short explanations, and examples related to the project. " +
          "Explain piezoelectricity, sound waves, voltage, current, bridge rectifiers, capacitors, LEDs, " +
          "energy conversion, and basic circuit ideas when relevant. " +
          "Do not pretend the simulation measurements are real laboratory measurements. " +
          "If asked about unrelated topics, politely say you are focused on this science project."
      }
    });

    res.json({ reply: response.text || "AI_CORE returned no text." });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "The AI service could not answer right now."
    });
  }
});

// Serper Web Search Route
app.post("/api/search", async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: query },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Serper API error:", error);
    res.status(500).json({ error: "Failed to fetch search results." });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Science Fair server running at http://localhost:${PORT}`);
});
