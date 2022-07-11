import express from "express";
import cors from "cors";
import { SystemInfo } from "./SystemInfo";
import { capitalizeFirstLetter } from "../external/scd-registry-common/src/util/String";
import package_json from "../package.json";

export function createExpressServer(
  info: SystemInfo,
  hostIp: string = "localhost",
  port: number = 7777
) {
  const app = express().use(
    cors({
      origin: "*",
    })
  );

  app.get("/", async (req, res) => {
    console.log(`System info request: ${JSON.stringify(info)}`);
    res.send(info);
  });

  app.listen(port, () => {
    console.log(
      `${capitalizeFirstLetter(
        package_json.name
      )} listening at http://${hostIp}:${port}`
    );
  });
}
