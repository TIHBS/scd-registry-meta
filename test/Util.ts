import { SystemInfo } from "../src/SystemInfo";
import fetch from "node-fetch";

export async function waitUntilEnvironmentStarted(): Promise<
  [boolean, SystemInfo]
> {
  let fetched = false;
  let response: SystemInfo;
  while (!fetched) {
    try {
      response = await (await fetch("http://localhost:7777")).json();
      fetched = true;
    } catch (err) {
      console.error(err);
      fetched = false;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return [fetched, response];
}
