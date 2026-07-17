FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    unzip \
    tzdata \
    libaio1t64 \
    libaio-dev \
    build-essential \
    && ln -snf /usr/share/zoneinfo/America/Mexico_City /etc/localtime \
    && echo America/Mexico_City > /etc/timezone \
    && ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 \
    && rm -rf /var/lib/apt/lists/*

COPY instantclient/instantclient_23_26 /opt/oracle/instantclient

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient
ENV PATH=$LD_LIBRARY_PATH:$PATH
ENV TZ=America/Mexico_City

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]