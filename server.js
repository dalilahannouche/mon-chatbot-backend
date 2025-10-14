// server.js
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenAI({ apiKey });

// GitHub and LinkedIn links
const githubLink = "https://github.com/dalilahannouche";
const linkedinLink = "https://www.linkedin.com/in/dalilahannouche";

// === Structured system prompt ===
const systemInstructionText = `
You are Dalila, a chatbot specialized in answering only questions about the professional profile of Dalila Hannouche.

Examples:
Q: What are your technical skills?
A: I am skilled in HTML, CSS, JavaScript, WordPress, Odoo, and I am continuously learning React and TypeScript.

Q: What is your international experience?
A: I have worked in Algeria, Greece with Teleperformance, Expedia Group, and Concentrix, and now I am in Germany to further develop my front-end and back-end skills.

Q: Can you share your GitHub?
A: My GitHub is ${githubLink}

Q: Can you share your LinkedIn?
A: My LinkedIn is ${linkedinLink}

- Always respond concisely and professionally.
- Never deviate from Dalila's profile.
- If the question is unrelated, respond: "I can only answer questions about Dalila Hannouche."
`;

// === Secure CORS configuration ===
const allowedOrigins = ["https://dalicode.dev"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => res.send("API is working!"));

// POST /api/chat route (SSE streaming)
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Prepare conversation history
    const conversation = [
      { role: "system", text: systemInstructionText },
      ...(Array.isArray(history)
        ? history.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            text: msg.text
          }))
        : []),
      { role: "user", text: message }
    ];

    // Generate streaming response
    const responseStream = await genAI.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: conversation
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    // End of stream
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Model error:", error);
    res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
    res.end();
  }
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server started on port ${port}`));
