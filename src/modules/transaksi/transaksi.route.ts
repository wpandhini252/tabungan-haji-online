import { Router } from "express";
import { transaksiController } from "./transaksi.controller";
import { authenticate } from "../../middleware/auth";

export const transaksiRoutes = Router();

transaksiRoutes.use(authenticate);

transaksiRoutes.post("/", transaksiController.create);
transaksiRoutes.post("/qris/setor", transaksiController.setorQris);
transaksiRoutes.get("/", transaksiController.findAll);
transaksiRoutes.get("/:id", transaksiController.findById);
