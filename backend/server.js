import express from "express";
import dotenv from "dotenv";
import routes from "./src/routes/index.js";

dotenv.config();
const app = express();

app.use(express.json());

// routes
app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
