import express from "express";
import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 4000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const companyName = process.env.COMPANY_NAME || "AX AI Ventures"; // 💡 Brand name loaded dynamically

// Ensure content folder and starter file exist
fs.mkdirSync("./content", { recursive: true });
if (!fs.existsSync("./content/latest.html")) {
  const starter = `
  <article>
    <h2>Welcome to ${companyName} 🚀</h2>
    <p>Your AI is preparing to generate your first live update. Stay tuned!</p>
  </article>`;
  fs.writeFileSync("./content/latest.html", starter, "utf8");
}

async function generateContent() {
  console.log("🧠 Generating new content...");
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional tech journalist writing for ${companyName}. Always use ${companyName} as the brand name, keep tone premium and engaging.`,
        },
        {
          role: "user",
          content:
            `Write a 2–3 paragraph homepage update about recent AI or technology innovation by ${companyName}. ` +
            `Return clean HTML paragraphs only (no markdown).`,
        },
      ],
    });

    const newUpdate = response.choices[0].message.content;
    const timestamp = new Date().toLocaleString();

    // Read existing content
    let existing = fs.readFileSync("./content/latest.html", "utf8");

    // Append new update below existing content
    const updated = `
${existing}
<hr />
<article>
  <h3>AI Update — ${timestamp}</h3>
  ${newUpdate}
</article>`;

    fs.writeFileSync("./content/latest.html", updated, "utf8");
    console.log("✅ New AI update added successfully!");
  } catch (err) {
    console.error("❌ Error generating content:", err);
  }
}

// Generate once on start, then every 6h
generateContent();
setInterval(generateContent, 6 * 60 * 60 * 1000);

app.get("/", (req, res) => {
  const content = fs.existsSync("./content/latest.html")
    ? fs.readFileSync("./content/latest.html", "utf8")
    : "<p>Generating first update...</p>";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${companyName} | AI Self-Updating Site ✨</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --bg-light: #f9f9f9;
            --text-light: #222;
            --bg-dark: #1b1b1b;
            --text-dark: #eee;
            --primary: #6366f1;
            --secondary: #8b5cf6;
            --card-bg-light: #fff;
            --card-bg-dark: #2b2b2b;
          }

          * { box-sizing: border-box; }
          body {
            font-family: "Inter", Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--bg-light);
            color: var(--text-light);
            line-height: 1.7;
            transition: all 0.3s ease;
          }

          header {
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            color: white;
            text-align: center;
            padding: 60px 20px 40px;
            border-bottom-left-radius: 40px;
            border-bottom-right-radius: 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          }
          header h1 {
            margin: 0;
            font-size: 2.4rem;
            letter-spacing: 1px;
          }
          header p { margin-top: 10px; opacity: 0.9; }

          main {
            max-width: 900px;
            margin: 40px auto;
            padding: 0 20px 60px;
          }

          article {
            background: var(--card-bg-light);
            color: var(--text-light);
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          article:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
          }
          h3 {
            color: var(--primary);
            margin-bottom: 10px;
          }
          .brand {
            color: var(--secondary);
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          hr {
            border: 0;
            border-top: 1px solid #ddd;
            margin: 40px 0;
          }
          footer {
            text-align: center;
            font-size: 0.9rem;
            padding: 30px;
            color: #777;
          }

          /* Dark mode */
          body.dark {
            background: var(--bg-dark);
            color: var(--text-dark);
          }
          body.dark article {
            background: var(--card-bg-dark);
            color: var(--text-dark);
          }
          body.dark h3 { color: #a5b4fc; }
          body.dark .brand { color: #a5b4fc; }

          .toggle-theme {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            border: none;
            color: white;
            border-radius: 20px;
            padding: 8px 14px;
            cursor: pointer;
            font-size: 0.9rem;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            transition: background 0.3s;
          }
          .toggle-theme:hover { background: var(--secondary); }

          @media (max-width: 600px) {
            header h1 { font-size: 1.8rem; }
            main { margin: 20px auto; }
          }
        </style>
      </head>

      <body>
        <button class="toggle-theme" onclick="toggleTheme()">🌗 Toggle Theme</button>
        <header>
          <h1><span class="brand">${companyName}</span></h1>
          <p>Latest auto-generated insights on technology & innovation</p>
        </header>

        <main>
          <p style="text-align:center; font-size:0.9rem; color:#666;">
            Last checked: ${new Date().toLocaleString()}
          </p>
          <hr />
          ${content}
        </main>

        <footer>
          Made with ❤️ by <span class="brand">${companyName}</span> | Powered by OpenAI
        </footer>

        <script>
          function toggleTheme() {
            document.body.classList.toggle('dark');
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
