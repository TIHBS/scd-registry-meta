import { scdToMetadata, storeMetadata } from "../src/Util";
import * as scdWrongSig from "../external/scd-registry-http-storage/public/scd-wrong-sig.json";

async function main() {
  const hostIp = process.env.HOST_IP ? process.env.HOST_IP : "172.17.0.1";
  const scdWrongSigMetadata = await scdToMetadata(
    scdWrongSig as any,
    `http://${hostIp}:49160/scd-wrong-sig.json`
  );
  scdWrongSigMetadata.signature =
    "0xd9994c3be722cd557e54f3e61e713483be865f9a2b8ae41dd931871dabad3cb103dcf9379e2e4e84fa682b4f89b390637318b97e17a10dd8382ff998f88277381b";

  await storeMetadata(scdWrongSigMetadata);
}

main()
  .then(() => console.log("Finished!"))
  .catch((err) => console.log(err));
