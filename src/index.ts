import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 3111;

app.listen(PORT, () => console.log(`Wallet service running on http://localhost:${PORT}`));
