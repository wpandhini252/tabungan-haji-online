import { Router } from "express";
import { transaksiController } from "./transaksi.controller";

export const transaksiRoutes = Router();

transaksiRoutes.post("/", transaksiController.create);
transaksiRoutes.get("/", transaksiController.findAll);
transaksiRoutes.get("/:id", transaksiController.findById);
