FROM python:3.13-slim

WORKDIR /app

# Combine system dependencies (Build tools + Playwright libraries)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libcairo2-dev \
    pkg-config \
    python3-dev \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf-2.0-0 \
    libxss1 \
    libxtst6 \
    libxrandr2 \
    libappindicator3-1 \
    fonts-liberation \
    xdg-utils \
    libasound2t64 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python deps (with no-cache) and Playwright browsers
RUN pip install --no-cache-dir -r requirements.txt && playwright install

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]