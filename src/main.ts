#! /bin/node

import { executeCommand, Result } from "./ExecuteCommand";
import * as child_process from "child_process";
import { createExpressServer } from "./CreateExpressServer";
import ora from "ora";

const composeFiles = [
  "external/external-search-provider/docker-compose.yml",
  "external/webserver-storage/docker-compose.yml",
  "external/decentralised-scd-registry-frontend/docker-compose.yml",
];

const registryComposeFile =
  "external/decentralised-scd-registry/docker-compose.yml";

const childProcesses: child_process.ChildProcess[] = [];
const hostIpDocker = "172.17.0.1";
const hostIp = "localhost";
const spinner = ora();

async function main() {
  // Starts swarm
  try {
    spinner.start(" Starting Bee cluster");
    childProcesses.push(
      (
        await executeCommand(
          "npx bee-factory start 1.5.1",
          undefined,
          "Welcome to Swarm.... Bzzz Bzzzz Bzzzz"
        )
      ).process
    );
    spinner.succeed(" Started Bee cluster");
  } catch (err) {
    spinner.fail(" Failed to start Bee cluster");
    return;
  }

  // Starts ganache with the registry contract
  let registryContractResult: Result;
  const toWaitFor = "DEPLOYED REGISTRY CONTRACT AT: ";
  try {
    spinner.start(" Starting Registry contract");
    registryContractResult = await executeCommand(
      `docker-compose -f ${registryComposeFile} up`,
      undefined,
      toWaitFor
    );
    childProcesses.push(registryContractResult.process);
    spinner.succeed(" Started Registry contract");
  } catch (err) {
    spinner.fail(" Failed to start Registry contract");
    return;
  }

  // Parses the registry address out of the log
  const registryAddress = registryContractResult!.line?.substring(
    toWaitFor.length,
    registryContractResult!.line.length
  );

  const info = {
    registryAddress: registryAddress,
    ethereumNetworkUrl: `http://${hostIp}:8545`,
    ethereumNetworkId: 57771,
    webserverStorage: `http://${hostIp}:49160`,
    externalSearchProvider: `http://${hostIp}:3000`,
    swarmAPi: `http://${hostIp}:1633`,
    swarmDebug: `http://${hostIp}:1635`,
  };

  const environment = {
    REGISTRY_ADDRESS: registryAddress,
    ETHEREUM_NETWORK_URL: `http://${hostIpDocker}:8545`,
    ELASTICSEARCH_URL: `http://${hostIpDocker}:9200`,
    SWARM_URL: `http://${hostIpDocker}:1633`,
  };

  // Starts the remaining services
  for (const filePath of composeFiles) {
    try {
      spinner.start(` Running docker-compose with: ${filePath}`);
      childProcesses.push(
        (await executeCommand(`docker-compose -f ${filePath} up`, environment))
          .process
      );
      spinner.succeed(` Finished running docker-compose with: ${filePath}`);
    } catch (err) {
      spinner.fail(` Failed to run docker-compose with ${filePath}`);
      return;
    }
  }

  // Listens for logs
  const textdecoder = new TextDecoder();
  childProcesses
    .filter((process) => process.stdout)
    .forEach((process) =>
      process.stdout!.addListener("data", (chunk) => {
        const log = textdecoder.decode(chunk);
        console.log(log);
      })
    );

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

  const server = createExpressServer(info, hostIp);

  return finished;
}

// Kills all subprocesses on receiving a "SIGINT"
process.on("SIGINT", function () {
  spinner.clear();
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
  })
  .finally(() => spinner.clear());
