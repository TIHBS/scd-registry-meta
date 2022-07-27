import {
  createRegistryContract,
  fetchSystemInfo,
  scdToMetadata,
  storeMetadata,
} from "../src/Util";
import * as scdWrongKey from "../external/scd-registry-http-storage/public/scd-wrong-key.json";

async function main() {
  const hostIp = process.env.HOST_IP ? process.env.HOST_IP : "172.17.0.1";
  const systemInfo = await fetchSystemInfo();
  const registry = createRegistryContract(systemInfo.registryAddress);
  const scdWrongKeyMetadata = await scdToMetadata(
    scdWrongKey as any,
    `http://${hostIp}:49160/scd-wrong-key.json`
  );

  const asString = JSON.stringify((scdWrongKey as any).default);
  scdWrongKeyMetadata.signature = await registry.signer.signMessage(asString);

  await storeMetadata(scdWrongKeyMetadata);
}

main()
  .then(() => console.log("Finished!"))
  .catch((err) => console.log(err));
