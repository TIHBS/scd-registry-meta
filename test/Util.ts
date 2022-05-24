import { SystemInfo } from "../src/SystemInfo";
import fetch from "node-fetch";
import { Registry__factory } from "../external/decentralised-scd-registry-common/src/wrappers/factories/Registry__factory";
import testWallets from "../external/decentralised-scd-registry/src/util/wallets";
import { ethers, getDefaultProvider, providers, Signer } from "ethers";
import { Registry } from "../external/decentralised-scd-registry-common/src/wrappers/Registry";
import { Metadata } from "../external/decentralised-scd-registry-common/src/interfaces/Metadata";
import { SCD } from "../external/decentralised-scd-registry-common/src/interfaces/SCD";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import ora from "ora";

export function startRegistry(): ChildProcessWithoutNullStreams {
  return spawn("npm", ["run", "start:dev"]);
}

export function stopRegistry(process: ChildProcessWithoutNullStreams) {
  for (let i = 0; i < 2; i++) {
    process.kill("SIGINT");
  }
}

export function dockerKillAll() {
  return spawn("docker", ["kill", "$(docker ps -aq)"]);
}

export async function waitUntilEnvironmentStarted(): Promise<
  [boolean, SystemInfo]
> {
  let fetched = false;
  let response: SystemInfo;
  const spinner = ora();
  spinner.start(" Waiting until the system started...");
  while (!fetched) {
    try {
      response = await (await fetch("http://localhost:7777")).json();
      fetched = true;
    } catch (err) {
      fetched = false;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  spinner.succeed(" The system started...");
  spinner.stop();
  spinner.clear();
  return [fetched, response];
}

export function createSigner(url = "http://localhost:8545"): Signer {
  const provider = getDefaultProvider(url);
  return new ethers.Wallet(testWallets[0].privateKey, provider);
}

export function createRegistryContract(address: string): Registry {
  return Registry__factory.connect(address, createSigner());
}

export async function scdToMetadata(scd: SCD, url: string): Promise<Metadata> {
  const functionNames = scd.functions.map((func) => func.name);
  const eventNames = scd.events ? scd.events.map((event) => event.name) : [];
  const signature = await createSigner().signMessage(JSON.stringify(scd));
  const authorAddress = await (await createSigner()).getAddress();

  return {
    name: scd.name,
    author: authorAddress,
    version: scd.version,
    signature: signature,
    internal_address: scd.internal_address,
    url: new URL(url),
    blockchain_type: scd.blockchain_type,
    functions: functionNames,
    events: eventNames,
    is_valid: true,
  };
}

export async function queryExternalSearchProvider(
  externalSearchProvider: string,
  query: string,
  onlyId: boolean = false
) {
  const onlyIdString = onlyId ? "true" : "false";
  const url = `${externalSearchProvider}?onlyId=${onlyIdString}&query=${query}`;
  const result = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return result.json();
}
