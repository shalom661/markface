FROM python:3.12-slim

# Set working directory
WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies via requirements.txt (faster & more reliable in Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# pyproject.toml is kept for pytest config / local dev use
ENV PYTHONPATH=/app

EXPOSE 8000
