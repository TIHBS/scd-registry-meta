import { exec, execSync } from "child_process";
import * as ProjectRootDir from "app-root-dir";
import { join } from "path";
import { readdirSync } from "fs";

async function executeScript(name: string): Promise<Buffer> {
  const path = join(ProjectRootDir.get(), `scripts`, name);
  console.log(`Executing: ${name}`);
  console.log(path);
  const result = execSync(`npx ts-node ${path}`);
  console.log(result.toString());
  return result;
}

async function main() {
  const base = join(ProjectRootDir.get(), "external");
  const composeFileName = "docker-compose.yml";

  const processes = readdirSync(base)
    .filter((submoduleName) => {
      const submodulePath = join(base, submoduleName);
      return readdirSync(submodulePath).includes(composeFileName);
    })
    .map((submoduleName) => {
      const submodulePath = join(base, submoduleName);
      const process = exec(
        `docker-compose -f ${submodulePath}/${composeFileName} build`
      );
      process.stdout?.addListener("data", (chunk) => console.log(chunk));
      return process;
    });

  await Promise.all(
    processes.map((process) => {
      return new Promise<boolean>((resolve) => {
        process.on("exit", function () {
          resolve(true);
        });
      });
    })
  );
}

main()
  .then(() => console.log("Finished!"))
  .catch((err) => console.log(err));
