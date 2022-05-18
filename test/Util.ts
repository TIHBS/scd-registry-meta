import { SystemInfo } from "../src/SystemInfo";
import fetch from "node-fetch";
import { Registry__factory } from "../external/decentralised-scd-registry-common/src/wrappers/factories/Registry__factory";
import testWallets from "../external/decentralised-scd-registry/src/util/wallets";
import { ethers, getDefaultProvider, providers, Signer } from "ethers";
import { Registry } from "../external/decentralised-scd-registry-common/src/wrappers/Registry";
import { Metadata } from "../external/decentralised-scd-registry-common/src/interfaces/Metadata";
import { SCD } from "../external/decentralised-scd-registry-common/src/interfaces/SCD";

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
