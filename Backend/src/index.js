import { createApp } from "./app.js";
import { config } from "./config.js";
import { initDb } from "./services/storage.js";

await initDb();
const app = createApp();

app.listen(config.port, () => {
  console.log(`Reviewer Generator API running on port ${config.port}`);
});
