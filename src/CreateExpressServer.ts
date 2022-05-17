import express from "express";
import cors from "cors";
import { Info } from "./Info";
import { capitalizeFirstLetter } from "../external/decentralised-scd-registry-common/src/util/String";
import package_json from "../package.json";

export function createExpressServer(info: Info, port: number = 7777) {
  const app = express().use(
    cors({
      origin: "*",
    })
  );

  app.get("/", async (req, res) => {
    console.log(`Info request: ${JSON.stringify(info)}`);
    res.send(info);
  });

  app.listen(port, () => {
    console.log(
      `${capitalizeFirstLetter(package_json.name)} listening at ${port}`
    );
  });
}
