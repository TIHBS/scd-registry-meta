#! /bin/node

import { executeCommand, Result } from "./ExecuteCommand";
import * as child_process from "child_process";
import { createExpressServer } from "./CreateExpressServer";
import ora from "ora";
import { SystemInfo } from "./SystemInfo";

const composeFiles = [
  "external/scd-registry-external-search-provider/docker-compose.yml",
  "external/scd-registry-http-storage/docker-compose.yml",
];

const registryComposeFile = "external/scd-registry-contract/docker-compose.yml";
const frontendComposeFile = "external/scd-registry-frontend/docker-compose.yml";

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
  )!;

  // Starts the frontend
  let frontendResult: Result;
  const toWaitForFrontend = "The website can be found at ";
  try {
    spinner.start(" Starting the frontend");
    frontendResult = await executeCommand(
      `docker-compose -f ${frontendComposeFile} up scd-registry-swarm`,
      undefined,
      toWaitForFrontend
    );
    childProcesses.push(frontendResult.process);
    spinner.succeed(" Started the frontend");
  } catch (err) {
    spinner.fail(" Failed to start the frontend");
    return;
  }

  // Parses the frontend address out of the log
  let frontendAddress = frontendResult!.line?.substring(
    toWaitForFrontend.length,
    frontendResult!.line.length
  )!;
  // Replaces the docker host with the host ip
  frontendAddress = frontendAddress?.replace(hostIpDocker, hostIp);

  const info: SystemInfo = {
    registryAddress: registryAddress,
    networkish: `http://${hostIp}:8545`,
    httpStorage: `http://${hostIp}:49160`,
    externalSearchProvider: `http://${hostIp}:3000`,
    frontendUrl: frontendAddress,
    swarmAPi: `http://${hostIp}:1633`,
    swarmDebug: `http://${hostIp}:1635`,
  };

  const environment = {
    REGISTRY_ADDRESS: registryAddress,
    NETWORKISH: `http://${hostIpDocker}:8545`,
    ELASTICSEARCH_URL: `http://${hostIpDocker}:9200`,
    SWARM_API: `http://${hostIpDocker}:1633`,
    SWARM_DEBUG: `http://${hostIpDocker}:1635`,
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

function stop(signal: NodeJS.Signals) {
  spinner.stop();
  spinner.clear();
  console.log("Caught interrupt signal");
  childProcesses.forEach((process) => process.kill(signal));
  childProcesses.forEach((process) => process.kill(signal));

  process.exit(130);
}

// Kills all subprocesses on receiving a kill
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

main()
  .then(() => {
    console.log("Killed all subprocesses");
    childProcesses.forEach((process) => process.kill());
    process.exit(0);
  })
  .catch(() => {
    console.log("Failed to start all processes");
    childProcesses.forEach((process) => process.kill());
    process.exit(1);
  })
  .finally(() => spinner.clear());
