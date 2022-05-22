import { SystemInfo } from "../src/SystemInfo";
import { expect } from "./MochaConfig";
import {
  createRegistryContract,
  scdToMetadata,
  waitUntilEnvironmentStarted,
} from "./Util";
import * as scd1 from "../external/webserver-storage/public/scd1.json";
import * as scd2 from "../external/webserver-storage/public/scd2.json";
import {
  fromContractType,
  toContractType,
} from "../external/decentralised-scd-registry-common/src/Conversion";
import { SCD } from "../external/decentralised-scd-registry-common/src/interfaces/SCD";
import fetch from "node-fetch";

describe("Started", () => {
  let fetched;
  let response: SystemInfo;

  beforeEach(async function () {
    [fetched, response] = await waitUntilEnvironmentStarted();
  });

  after(async function () {});

  it("should start the system and the system info should contain information", async function () {
    expect(fetched).to.be.true;

    expect(response.ethereumNetworkId).to.equal(57771);
    expect(response.ethereumNetworkUrl).to.equal("http://localhost:8545");
    expect(response.externalSearchProvider).to.equal("http://localhost:3000");
    expect(response.swarmAPi).to.equal("http://localhost:1633");
    expect(response.swarmDebug).to.equal("http://localhost:1635");
    expect(response.webserverStorage).to.equal("http://localhost:49160");

    {
      // Checks the frontend url
      const exampleFrontendUrl =
        "http://localhost:1633/bzz/c84ed3df021c60ed2b6973d59acce30cb588223a12051707a57303b43e3e0927/index.html";
      expect(response.frontendUrl).to.have.length(exampleFrontendUrl.length);
      const index = response.frontendUrl.search(
        /http:\/\/localhost:1633\/bzz\/[a-z0-9]*\/index.html/
      );
      expect(index).to.equal(0);
    }

    {
      // Checks the registry address
      const exampleRegistryAddress =
        "0x222E34DA1926A9041ed5A87f71580D4D27f84fD3";
      expect(response.registryAddress).to.have.length(
        exampleRegistryAddress.length
      );
      const index = response.registryAddress.search(/0x[A-Z0-9]*/);
      expect(index).to.equal(0);
    }
  });

  it("should store scd1.json and retieve it from the contract itself", async function () {
    const expected = await scdToMetadata(
      scd1 as SCD,
      "http://localhost:49160/scd1.json"
    );
    const expectedForTheContract = toContractType(expected);
    const registry = createRegistryContract(response.registryAddress);
    await registry.store(expectedForTheContract);
    const result = fromContractType(
      await (
        await registry.retrieveById(0)
      ).metadata
    );

    expect(result).to.deep.equal(expected);
    const scd = await (await fetch(result.url)).json();

    expect(scd).to.deep.equal(scd1["default"]);
  });

  it("should store scd2.json and retieve it from the contract itself", async function () {
    const expected = await scdToMetadata(
      scd2 as SCD,
      "http://localhost:49160/scd2.json"
    );
    const expectedForTheContract = toContractType(expected);
    const registry = createRegistryContract(response.registryAddress);
    await registry.store(expectedForTheContract);
    const result = fromContractType(
      await (
        await registry.retrieveById(1)
      ).metadata
    );

    expect(result).to.deep.equal(expected);
    const scd = await (await fetch(result.url)).json();

    expect(scd).to.deep.equal(scd2["default"]);
  });
});
