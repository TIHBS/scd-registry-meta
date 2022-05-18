import { SystemInfo } from "../src/SystemInfo";
import { expect } from "./MochaConfig";
import { waitUntilEnvironmentStarted } from "./Util";

describe("Started", () => {
  let fetched;
  let response: SystemInfo;

  before(async function () {
    [fetched, response] = await waitUntilEnvironmentStarted();
    console.log(JSON.stringify(response));
  });

  after(async function () {});

  it("should start and the system info should contain information", async function () {
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
});
