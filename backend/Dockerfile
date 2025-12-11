WORKDIR /app

COPY backend/requirements.txt .
COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
@@ -13,6 +13,6 @@ RUN apt-get update && apt-get install -y \

RUN pip install -r requirements.txt && playwright install

COPY backend/ .
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
