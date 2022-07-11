import { SystemInfo } from "../src/SystemInfo";
import { expect } from "./MochaConfig";
import {
  createRegistryContract,
  queryExternalSearchProvider,
  scdToMetadata,
  startRegistry,
  stopRegistry,
  waitUntilEnvironmentStarted,
} from "./Util";
import * as scd1 from "../external/http-storage/public/scd1.json";
import * as scd2 from "../external/http-storage/public/scd2.json";
import {
  fromContractType,
  toContractType,
} from "../external/decentralised-scd-registry-common/src/Conversion";
import {
  SCD,
  SCDWithID,
} from "../external/decentralised-scd-registry-common/src/interfaces/SCD";
import { ChildProcessWithoutNullStreams } from "child_process";
import { Registry } from "../external/decentralised-scd-registry-common/src/wrappers/Registry";
import { join } from "path";
import fetch from "node-fetch";

describe("Integration tests", () => {
  let fetched;
  let systemInfo: SystemInfo;
  let registryProcess: ChildProcessWithoutNullStreams;
  let registry: Registry;
  const hostIp = process.env.HOST_IP ? process.env.HOST_IP : "172.17.0.1";

  before(async function () {
    this.timeout(600000);
    registryProcess = startRegistry();
    [fetched, systemInfo] = await waitUntilEnvironmentStarted();

    registry = createRegistryContract(systemInfo.registryAddress);

    // Store scd1
    {
      const first = await scdToMetadata(
        scd1 as SCD,
        `http://${hostIp}:49160/scd1.json`
      );
      await registry.store(toContractType(first));
    }

    // Store scd2
    {
      const second = await scdToMetadata(
        scd2 as any as SCD,
        `http://${hostIp}:49160/scd2.json`
      );
      await registry.store(toContractType(second));
    }

    // wait a minute for everything to become ready
    console.log("Take a break. It will only take a minute I promise:)");
    await new Promise((resolve) => setTimeout(resolve, 60000));
  });

  after(async function () {
    this.timeout(300000);
    stopRegistry(registryProcess);
  });

  it("should start the system and the system info should contain information", async function () {
    expect(fetched).to.be.true;

    expect(systemInfo.networkish).to.equal("http://localhost:8545");
    expect(systemInfo.externalSearchProvider).to.equal("http://localhost:3000");
    expect(systemInfo.swarmAPi).to.equal("http://localhost:1633");
    expect(systemInfo.swarmDebug).to.equal("http://localhost:1635");
    expect(systemInfo.httpStorage).to.equal("http://localhost:49160");

    {
      // Checks the frontend url
      const exampleFrontendUrl =
        "http://localhost:1633/bzz/c84ed3df021c60ed2b6973d59acce30cb588223a12051707a57303b43e3e0927/index.html";
      expect(systemInfo.frontendUrl).to.have.length(exampleFrontendUrl.length);
      const index = systemInfo.frontendUrl.search(
        /http:\/\/localhost:1633\/bzz\/[a-z0-9]*\/index.html/
      );
      expect(index).to.equal(0);
    }

    {
      // Checks the registry address
      const exampleRegistryAddress =
        "0x222E34DA1926A9041ed5A87f71580D4D27f84fD3";
      expect(systemInfo.registryAddress).to.have.length(
        exampleRegistryAddress.length
      );
      const index = systemInfo.registryAddress.search(/0x[A-Z0-9]*/);
      expect(index).to.equal(0);
    }
  });

  describe("SCD1", () => {
    it("should fetch the metadata of scd1.json from the contract", async function () {
      const expected = await scdToMetadata(
        scd1 as SCD,
        `http://${hostIp}:49160/scd1.json`
      );
      const result = fromContractType(
        await (
          await registry.retrieveById(0)
        ).metadata
      );

      expect(result).to.deep.equal(expected);
    });
    it("should fetch scd1.json from the external search provider", async function () {
      const result = await queryExternalSearchProvider(
        systemInfo.externalSearchProvider,
        scd1.name
      );
      expect((result[0] as SCDWithID).scd).to.deep.equal(scd1["default"]);
    });

    it("should fetch the id of scd1.json from the external search provider", async function () {
      const result = await queryExternalSearchProvider(
        systemInfo.externalSearchProvider,
        scd1.name,
        true
      );
      expect(result[0].hex).to.equal("0x00");
    });

    it("should fetch scd1 from the webserver storage", async () => {
      const scd = await (
        await fetch(join(systemInfo.httpStorage, "scd1.json"))
      ).json();
      expect(scd).to.deep.equal(scd1["default"]);
    });
  });

  describe("SCD2", () => {
    it("should fetch the metadata of scd2.json from the contract", async function () {
      const expected = await scdToMetadata(
        scd2 as any as SCD,
        `http://${hostIp}:49160/scd2.json`
      );
      const result = fromContractType(
        await (
          await registry.retrieveById(1)
        ).metadata
      );

      expect(result).to.deep.equal(expected);
    });

    it("should fetch scd2.json from the external search provider", async function () {
      const result = await queryExternalSearchProvider(
        systemInfo.externalSearchProvider,
        scd2.name
      );
      expect((result[0] as SCDWithID).scd).to.deep.equal(scd2["default"]);
    });

    it("should fetch the id of scd2.json from the external search provider", async function () {
      const result = await queryExternalSearchProvider(
        systemInfo.externalSearchProvider,
        scd2.name,
        true
      );
      expect(result[0].hex).to.equal("0x01");
    });

    it("should fetch scd2 from the webserver storage", async () => {
      const scd = await (
        await fetch(join(systemInfo.httpStorage, "scd2.json"))
      ).json();
      expect(scd).to.deep.equal(scd2["default"]);
    });
  });
});
