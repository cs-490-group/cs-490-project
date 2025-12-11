FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 libgconf-2-4 libxss1 libxtst6 libxrandr2 \
    libappindicator1 libappindicator3-1 fonts-liberation \
    xdg-utils libatk-bridge2.0-0 && rm -rf /var/lib/apt/lists/*

RUN pip install -r requirements.txt && playwright install

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
