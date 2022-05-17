import * as child_process from "child_process";

export interface Result {
  process: child_process.ChildProcess;
  line?: string;
}

function findByRegex(log: string, regexStr: string): string {
  const start = log.search(regexStr);
  const sub = log.substring(start, log.length);
  const end = sub.search("\n");
  return sub.substring(0, end);
}

export async function executeCommand(
  call: string,
  environment?: {},
  waitFor?: string
): Promise<Result> {
  const asArray = call.split(" ");

  if (asArray.length == 0) {
    throw new Error("The string cannot be empty!");
  }
  const command = asArray.shift();

  const textdecoder = new TextDecoder();
  const child = child_process.spawn(command!, asArray, { env: environment });
  return new Promise((resolve, reject) => {
    child.stdout.addListener("data", (chunk) => {
      const log = textdecoder.decode(chunk);
      if (!waitFor) {
        resolve({ process: child });
      }
      if (log.includes(waitFor!)) {
        resolve({ process: child, line: findByRegex(log, waitFor!) });
      }
    });
    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      reject();
    });
  });
}
