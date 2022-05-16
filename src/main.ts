import { executeCommand } from "./ExecuteCommand";
import * as child_process from "child_process";

const composeFiles = [
  "external/decentralised-scd-registry/docker-compose.yml",
  "external/decentralised-scd-registry-frontend/docker-compose.yml",
  "external/external-search-provider/docker-compose.yml",
  "external/webserver-storage/docker-compose.yml",
];

const childProcesses: child_process.ChildProcess[] = [];

async function main() {
  // Starts swarm
  const swarm = await executeCommand(
    "npx bee-factory start 1.5.1",
    "Welcome to Swarm.... Bzzz Bzzzz Bzzzz"
  );
  childProcesses.push(swarm);

  // Starts the remaining services
  for (const filePath of composeFiles) {
    const process = await executeCommand(`docker-compose -f ${filePath} up`);
    childProcesses.push(process);
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
  return finished;
}

// Kills all subprocesses
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
