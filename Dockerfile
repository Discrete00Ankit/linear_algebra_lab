FROM python:3.11-slim

# Install system audio libraries for librosa / soundfile decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy notebook, audio files, and all project files
COPY . .

# Expose Hugging Face default port
EXPOSE 7860

# Launch Voilà pointing to LA_Notebook_1.ipynb on port 7860
CMD ["voila", "LA_Notebook_1.ipynb", "--port=7860", "--no-browser", "--theme=light", "--VoilaConfiguration.file_whitelist=['.*']", "--VoilaConfiguration.unused_kernel_duration=300"]
