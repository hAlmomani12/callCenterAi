# callCenterAi

Arabic (Jordanian dialect) voice customer-service demo for Al-Manaseer Oil & Gas, built on [Pipecat](https://github.com/pipecat-ai/pipecat) and the OpenAI Realtime API.

> Demo only. Not an official Manaseer product.

## What's inside

| Path | What it is |
| --- | --- |
| `1-install.bat` | First-time setup on Windows: installs `uv`, downloads Pipecat, installs dependencies |
| `2-start.bat` | Starts the bot, picks a voice, opens `http://localhost:7860/client/` |
| `3-change-key.bat` | Removes the saved OpenAI key so you can enter a new one |
| `knowledge_base.md` | Company facts the agent answers from (prices, payment, Absher, Wasel, EV charging). Update fuel prices monthly |
| `app/manaseer-bot.py` | The bot: OpenAI Realtime speech-to-speech, Arabic transcription, Jordanian persona, serves the custom UI |
| `app/ui.html` | Built customer page (single file, images embedded) |
| `ui-source/` | Source for the page (`app.js`, `template2.html`, images, `build.py`) |
| `Dockerfile`, `railway.json` | Cloud deployment (Railway or any Docker host) |

## Run (Windows)

1. Double-click `1-install.bat` (once).
2. Double-click `2-start.bat`, paste your OpenAI API key the first time.
3. In the browser, click **ابدأ المكالمة**.

The original Pipecat page is still available at `http://localhost:7860/client-old/`.

## Deploy to Render (recommended right now)

Railway has paused new sign-ups, so Render is the easiest option. The same `Dockerfile` works without changes.

1. On [render.com](https://render.com): **New → Web Service → connect `callCenterAi`**. Render detects the Dockerfile.
2. Instance type **Free**; under Advanced set **Health Check Path** to `/healthz`.
3. Add the same environment variables as in the Railway table below.
4. After the build, open `https://<your-service>.onrender.com/client/`.

The free plan sleeps after 15 minutes without traffic and takes about a minute to wake up, so open the link shortly before a demo.

## Deploy to Railway

The repo includes a `Dockerfile` and `railway.json`, so Railway builds it automatically.

1. On [railway.com](https://railway.com): **New Project → Deploy from GitHub repo → `callCenterAi`**.
2. In the service, open **Variables** and add:

   | Variable | Value |
   | --- | --- |
   | `OPENAI_API_KEY` | your OpenAI key |
   | `DEMO_PASSWORD` | a password to share with the client (protects your key) |
   | `CF_TURN_KEY_ID` | Cloudflare TURN key id |
   | `CF_TURN_API_TOKEN` | Cloudflare TURN API token |
   | `BOT_VOICE` | optional: `cedar`, `marin`, `ash`, `coral` |

3. **Settings → Networking → Generate Domain**. Open `https://<your-domain>/client/` and log in with any username and the `DEMO_PASSWORD`.

Railway has no inbound UDP, so the voice audio goes through a TURN relay. Create a free one in the Cloudflare dashboard under **Realtime → TURN Server** (the first 1,000 GB are free). Without TURN, the page opens but calls usually have no audio.

## Rebuild the UI

```bash
cd ui-source
npm install
npx esbuild app.js --bundle --format=iife --minify --target=es2020 --outfile=bundle.js
cd ..
python ui-source/build.py
```

## Security

Your OpenAI key is stored only in `pipecat-main/.env`, which is git-ignored. Never commit it.
