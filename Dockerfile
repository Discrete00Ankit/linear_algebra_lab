FROM python:3.11-slim

# Install system audio libraries for librosa / soundfile decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Setup non-root user (compatible with Binder, Render, and standard Docker)
ARG NB_USER=jovyan
ARG NB_UID=1000
ENV USER=${NB_USER}
ENV HOME=/home/${NB_USER}

RUN adduser --disabled-password \
    --gecos "Default user" \
    --uid ${NB_UID} \
    ${NB_USER}

WORKDIR ${HOME}

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy notebook, audio files, and all project files
COPY . .
RUN chown -R ${NB_UID}:${NB_UID} ${HOME}

USER ${USER}
EXPOSE 7860
ENV PORT=7860

# Launch Voilà (supports dynamic $PORT for Render/Koyeb/Docker)
CMD ["sh", "-c", "voila LA_Notebook_1.ipynb --port=${PORT} --no-browser --theme=light --VoilaConfiguration.file_whitelist=['.*'] --VoilaConfiguration.unused_kernel_duration=300"]
