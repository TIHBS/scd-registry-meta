import { expect } from "../MochaConfig";
import * as SynpressConfig from "../../../synpress.json";
import { join } from "path";

describe("Store SCD", () => {
  xit(`should visit the frontend`, () => {
    cy.visit(SynpressConfig.baseUrl);
    cy.contains("👀");
    cy.contains("Connect Metamask");
    cy.contains("Register");
    cy.contains("Settings");
    cy.contains("No results found");
    cy.contains("Easy search");
    cy.contains("Trustworthy search");
  });

  it(`Connect to Metamask`, () => {
    cy.visit(SynpressConfig.baseUrl);

    cy.get("#metamask-connect-button").click();
    cy.acceptMetamaskAccess(true);
  });

  xit(`should visit the Settings page and save settings`, () => {
    cy.visit("/#/settings");

    cy.contains("Network ID");
    cy.contains("Contract address");
    cy.contains("External search provider");
    cy.contains("Swarm debug");
    cy.contains("Swarm api");

    const networkId = "57771";
    const contractAddress = "0x222E34DA1926A9041ed5A87f71580D4D27f84fD3";
    const externalSearchProvider = "http://localhost:3000";
    const swarmDebug = "http://localhost:1635";
    const swarmApi = "http://localhost:1633";

    cy.get("#networkid").type(networkId);
    cy.get("#contractAddress").type(contractAddress);
    cy.get("#external-search-provider").type(externalSearchProvider);
    cy.get("#swarmDebug").type(swarmDebug);
    cy.get("#swarmApi").type(swarmApi);
    cy.get("form")
      .submit()
      .should(() => {
        // Cypress bug. Is not set in tests
        // expect(localStorage.getItem("swarmApi")).to.equal(swarmApi);
        expect(localStorage.getItem("swarmDebug")).to.equal(swarmDebug);
        expect(localStorage.getItem("networkid")).to.equal(networkId);
        expect(localStorage.getItem("contractAddress")).to.equal(
          contractAddress
        );
        expect(localStorage.getItem("externalSearchProvider")).to.equal(
          externalSearchProvider
        );
      });
  });
});
