import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { nasabahRoutes } from "./modules/nasabah/nasabah.route";
import { tabunganRoutes } from "./modules/tabungan/tabungan.route";
import { transaksiRoutes } from "./modules/transaksi/transaksi.route";
import { userRoutes } from "./modules/user/user.route";

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export const app = express();

app.use (helmet());
app.use (cors());
app.use (express.json());

app.get("/health", (req, res) => {
  res.json({
    status : "ok",
    service : "tabungan-haji-api",
    timestamp : new Date().toISOString(),
  });
});

app.use('/api/v1/nasabah', nasabahRoutes);
app.use('/api/v1/tabungan', tabunganRoutes);
app.use('/api/v1/transaksi', transaksiRoutes);
app.use('/api/v1/user', userRoutes);
