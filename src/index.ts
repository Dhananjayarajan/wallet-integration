import dotenv from "dotenv";

// Load correct .env file based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.prod"
    : ".env.dev";

dotenv.config({ path: envFile });


import app from "./app";

const PORT = process.env.PORT || 3111;

app.listen(PORT, () => {
  console.log(
    `🚀 Wallet service running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"} mode]`
  );
});
