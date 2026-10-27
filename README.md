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

## Run (Windows)

1. Double-click `1-install.bat` (once).
2. Double-click `2-start.bat`, paste your OpenAI API key the first time.
3. In the browser, click **ابدأ المكالمة**.

The original Pipecat page is still available at `http://localhost:7860/client-old/`.

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
