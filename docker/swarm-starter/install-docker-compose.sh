#! /bin/sh

apt update
apt install py-pip python-dev libffi-dev openssl-dev gcc libc-dev make -y
curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
