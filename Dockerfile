FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LD_LIBRARY_PATH=/opt/oracle/instantclient \
    PATH=/opt/oracle/instantclient:$PATH \
    TZ=America/Mexico_City

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    tzdata \
    libaio1 \
    libaio-dev \
    build-essential \
    curl \
    && ln -snf /usr/share/zoneinfo/America/Mexico_City /etc/localtime \
    && echo America/Mexico_City > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

COPY instantclient/instantclient_23_26 /opt/oracle/instantclient

RUN chmod -R 755 /opt/oracle/instantclient

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/', timeout=5)" || exit 1

CMD ["python", "app.py"]