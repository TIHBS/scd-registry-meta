FROM node:16

COPY package.json \
    package-lock.json \
    docker/swarm-starter/install-docker-cli.sh \
    docker/swarm-starter/install-docker-compose.sh \
    .

RUN ./install-docker-cli.sh
RUN ./install-docker-compose.sh

RUN npm i

CMD npm start
