# SCD registry meta

This repository is used to start the showcase system and test it.
It contains all the components as submodules.
Those submodules are:

- [scd-registry-frontend](https://github.com/GarondEisenfaust/scd-registry-frontend)
- [scd-registry-contract](https://github.com/GarondEisenfaust/scd-registry-contract)
- [scd-registry-common](https://github.com/GarondEisenfaust/scd-registry-common)
- [scd-registry-http-storage](https://github.com/GarondEisenfaust/scd-registry-http-storage)
- [scd-registry-external-search-provider](https://github.com/GarondEisenfaust/scd-registry-external-search-provider)

Thus, when cloning this repository users should run:

```bash
git clone --recurse-submodules -j8 https://github.com/TIHBS/scd-registry-meta.git
```

Or after cloning, it users should run:

```bash
git submodule update --init --recursive
```

The resulting system consists of docker containers.

## Requirements

- docker
- docker-compose
- npm
- node

## Build

It is recommended to build all containers, before starting the system.
To do this run the following.

```bash
npm i
npm run build
```

## Start

To start the system run the following:

```bash
npm start
```

This might take and while.
After the process finished, the connection information can be fetched by running:

```bash
curl localhost:7777 | json_pp
```

The result should be something like this:

```json
{
  "externalSearchProvider": "http://localhost:3000",
  "frontendUrl": "http://localhost:1633/bzz/fff8c8adfa7e57bd81a59d71f35ad3824424a07f32d2eb6c63b81e51683d3778/index.html",
  "networkish": "http://localhost:8545",
  "registryAddress": "0x222E34DA1926A9041ed5A87f71580D4D27f84fD3",
  "swarmAPi": "http://localhost:1633",
  "swarmDebug": "http://localhost:1635",
  "webserverStorage": "http://localhost:49160"
}
```

This means in this case the frontend can be reached at: [http://localhost:1633/bzz/fff8c8adfa7e57bd81a59d71f35ad3824424a07f32d2eb6c63b81e51683d3778/index.html](http://localhost:1633/bzz/fff8c8adfa7e57bd81a59d71f35ad3824424a07f32d2eb6c63b81e51683d3778/index.html)

## Test

To test the system we require all the containers to be new.
To make sure users can run:

```bash
docker container prune --force && docker volume prune --force
```

This deletes all stopped containers and volumes, the docker host manages.
If this is undesired, users need to delete the respective containers and volumes.

To start the tests:

```bash
npm test
```
