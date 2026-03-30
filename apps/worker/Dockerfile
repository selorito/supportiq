FROM python:3.11-slim

WORKDIR /app/apps/worker
ENV PYTHONPATH=/app/apps/backend:/app/packages/common

COPY packages/common /app/packages/common
COPY apps/backend/app /app/apps/backend/app
COPY apps/worker /app/apps/worker

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "worker.py"]
