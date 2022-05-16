import * as child_process from "child_process";

export async function executeCommand(
  call: string,
  waitFor?: string
): Promise<child_process.ChildProcess> {
  const asArray = call.split(" ");

  if (asArray.length == 0) {
    throw new Error("The string cannot be empty!");
  }
  const command = asArray.shift();

  const textdecoder = new TextDecoder();
  const child = child_process.spawn(command!, asArray);
  return new Promise((resolve, reject) => {
    child.stdout.addListener("data", (chunk) => {
      const log = textdecoder.decode(chunk);
      console.log(log);
      if (!waitFor) {
        resolve(child);
      }
      if (log.includes(waitFor!)) {
        resolve(child);
      }
    });
    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      reject();
    });
  });
}
