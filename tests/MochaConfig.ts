import chai from "chai";
import ChaiAsPromised from "chai-as-promised";
import ChaiHttp from "chai-http";

const { expect } = chai;
chai.use(ChaiAsPromised);
chai.use(ChaiHttp);
const should = chai.should();

export { expect, chai, should };
