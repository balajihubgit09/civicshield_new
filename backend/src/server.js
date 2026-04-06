import app from "./app.js";
import { config } from "./config.js";
import { datasetService } from "./services/datasetService.js";
import { systemService } from "./services/systemService.js";

datasetService.load();
const status = systemService.initialize();

app.listen(config.port, () => {
  console.log(`CivicShield backend listening on http://localhost:${config.port}`);
  console.log(`System state: ${status.status}`);
});
