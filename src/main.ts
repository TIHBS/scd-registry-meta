#! /bin/node

import { executeCommand } from "./ExecuteCommand";
import * as child_process from "child_process";
import { createExpressServer } from "./CreateExpressServer";

const composeFiles = [
  "external/external-search-provider/docker-compose.yml",
  "external/webserver-storage/docker-compose.yml",
  "external/decentralised-scd-registry-frontend/docker-compose.yml",
];

const registryComposeFile =
  "external/decentralised-scd-registry/docker-compose.yml";

const childProcesses: child_process.ChildProcess[] = [];
const hostIp = "172.17.0.1";

async function main() {
  // Starts swarm
  console.log("Starting local Bee cluster");
  childProcesses.push(
    (
      await executeCommand(
        "npx bee-factory start 1.5.1",
        undefined,
        "Welcome to Swarm.... Bzzz Bzzzz Bzzzz"
      )
    ).process
  );

  // Starts ganache with the registry contract
  console.log("Starting Registry contract");
  const toWaitFor = "DEPLOYED REGISTRY CONTRACT AT: ";
  const registryContractResult = await executeCommand(
    `docker-compose -f ${registryComposeFile} up`,
    undefined,
    toWaitFor
  );
  childProcesses.push(registryContractResult.process);

  // Parses the registry address out of the log
  const registryAddress = registryContractResult.line?.substring(
    toWaitFor.length,
    registryContractResult.line.length
  );

  const environment = {
    REGISTRY_ADDRESS: registryAddress,
    ETHEREUM_NETWORK_URL: `http://${hostIp}:8545`,
    ELASTICSEARCH_URL: `http://${hostIp}:9200`,
    SWARM_URL: `http://${hostIp}:1633`,
  };

  // Starts the remaining services
  for (const filePath of composeFiles) {
    console.log(`Running docker-compose with: ${filePath}`);
    childProcesses.push(
      (await executeCommand(`docker-compose -f ${filePath} up`, environment))
        .process
    );
  }

  // Necessary to resolve the promise when the script receives a "SIGINT"
  const finished = Promise.all(
    childProcesses.map((process) => {
      return new Promise<boolean>((resolve) => {
        process.on("exit", function () {
          resolve(true);
        });
      });
    })
  );

  const info = {
    registryAddress: registryAddress,
  };

  const server = createExpressServer(info);

  return finished;
}

// Kills all subprocesses on receiving a "SIGINT"
process.on("SIGINT", function () {
  console.log("Caught interrupt signal");
  childProcesses.forEach((process) => process.kill("SIGINT"));
});

main()
  .then(() => {
    console.log("Killed all subprocesses");
    process.exit(0);
  })
  .catch(() => {
    console.log("Failed to start all processes");
    process.exit(1);
  });
