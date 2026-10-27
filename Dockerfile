# Railway / any Docker host
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    SETUPTOOLS_SCM_PRETEND_VERSION=1.0.0

RUN apt-get update \
 && apt-get install -y --no-install-recommends git libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# Same Pipecat version the Windows setup uses (pinned so a new release can't break the demo)
ARG PIPECAT_REF=9d03e5b42b1e2c853a8a92856484e647ccfe1b22
RUN pip install "pipecat-ai[openai,webrtc,runner,silero,websocket,daily,livekit] @ git+https://github.com/pipecat-ai/pipecat.git@${PIPECAT_REF}"

WORKDIR /srv
COPY app/manaseer-bot.py app/ui.html ./
COPY knowledge_base.md ./

EXPOSE 8080
CMD ["sh", "-c", "python manaseer-bot.py --host 0.0.0.0 --port ${PORT:-8080}"]
