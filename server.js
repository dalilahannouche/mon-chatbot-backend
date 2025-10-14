// server.js (Côté serveur)
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config(); // Récupérer la clé API depuis le fichier .env

const app = express();

const githubLink = "https://github.com/dalilahannouche";
const linkedinLink = "https://www.linkedin.com/in/dalilahannouche";


const apiKey = process.env.API_KEY;
const genAI = new GoogleGenAI({ apiKey });

// Ton prompt complet
const systemInstructionText = `
Profile Overview:
Hi, my name is Dalila Hannouche. I am a creative and motivated Front-End Developer with 2+ years of experience in designing and developing responsive, user-friendly web applications. My journey is unique, as I transitioned from Algeria to Greece to work with international companies like Teleperformance, Expedia Group, and Concentrix. Now, I am in Germany, where I aim to enhance my skills and succeed in a country known for its technological excellence.

Why a Company Should Hire Me:
Technical Skills:
Expertise in HTML, CSS, JavaScript, Wordpress and Odoo.
Familiarity with frameworks and libraries such as React and TypeScript (actively improving my knowledge).
Experience optimizing websites for SEO and performance.
Professional Experience:
Worked in high-pressure environments requiring excellent communication and problem-solving skills.
Handled customer support roles for leading companies like Apple and Airbnb, enhancing my ability to collaborate effectively with diverse teams and understand user needs.
Successfully transitioned back to my passion for web development, leveraging skills in ERP systems like Odoo.

Soft Skills:
Multilingual: Fluent in Arabic, French, and English, with a growing proficiency in German.
Adaptable and resilient, having navigated international career transitions and cultural shifts.
Strong commitment to continuous learning and improvement.

Goals in Germany:
Germany’s thriving tech industry inspires me to push my boundaries.
I am focused on developing my expertise in modern front-end frameworks, expanding my backend knowledge with Python and Django, and contributing to innovative projects.

Github & LinkedIn:
Github: ${githubLink}
LinkedIn: ${linkedinLink}

Closing Statement:
I am eager to bring my unique background, technical expertise, and dedication to excellence to your team.

FAQs :
1. Who are you?
I am Dalila Hannouche, a front-end developer with a creative mindset and over 2 years of experience in web development. I transitioned from Algeria to Greece to work with global companies and I’m now in Germany to further my career.
2. What is your area of expertise?
I specialize in front-end development, focusing on responsive designs, user-friendly interfaces, and SEO optimization. I have expertise in HTML, CSS, JavaScript, WordPress and am continuously learning React, TypeScript, and backend technologies like Python/Django.
3. Why did you transition to Germany?
Germany is a hub for technology and innovation. My goal is to grow my skills in this advanced environment and contribute to impactful projects.
4. Why should a company hire you?
I bring:
A unique blend of technical and customer-facing experience.
Proven adaptability to new environments and challenges.
A commitment to delivering user-centric solutions.
5. What’s your github link?
${githubLink}
6. Where can I find you on LinkedIn?
${linkedinLink}
7. What hobbies do you have?
Outside of work, I enjoy expressing creativity through painting and playing the piano. I’m also the author of a French book, Révèle-moi ton secret, which reflects my passion for storytelling.
`;

// === Configuration CORS sécurisée ===
const allowedOrigins = [
  "https://dalicode.dev",
  "https://dalilahannouche.github.io" // si nécessaire
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

// Parse JSON
app.use(express.json());

// Route test
app.get("/", (req, res) => {
  res.send("API fonctionne correctement !");
});

// Route POST /api/chat (streaming SSE)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    // Headers SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const responseStream = await genAI.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        { role: "system", text: systemInstructionText },
        { role: "user", text: message }
      ]
    });

    // Envoyer chaque chunk dès qu'il arrive
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${chunk.text}\n\n`);
      }
    }

    // Terminer le flux
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error) {
    console.error("Erreur modèle :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Démarrage du serveur
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Serveur démarré sur le port ${port}`));
