FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 \
    libasound2 libxcb1 libx11-6 libglib2.0-0 libgobject-2.0-0 \
    libgio-2.0-0 libexpat1 && rm -rf /var/lib/apt/lists/*

RUN playwright install

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
