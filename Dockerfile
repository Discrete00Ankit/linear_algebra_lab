FROM python:3.10-slim

# Install system audio libraries for librosa / soundfile decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy notebook and local audio files
COPY . .

# Expose Hugging Face default port
EXPOSE 7860

# Launch Voilà pointing to your notebook on port 7860
CMD ["voila", "app.ipynb", "--port=7860", "--no-browser", "--theme=light", "--enable_nbextensions=True", "--VoilaConfiguration.file_whitelist=['.*']"]