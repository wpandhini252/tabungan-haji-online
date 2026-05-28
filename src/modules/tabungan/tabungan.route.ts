import { Router } from "express";
import { tabunganController } from "./tabungan.controller";
import { authenticate } from "../../middleware/auth";

export const tabunganRoutes = Router();

tabunganRoutes.use(authenticate);

tabunganRoutes.post("/", tabunganController.create);
tabunganRoutes.get("/", tabunganController.findAll);
tabunganRoutes.get("/:id/estimasi", tabunganController.estimasi);
tabunganRoutes.get("/:id", tabunganController.findById);
tabunganRoutes.patch("/:id", tabunganController.update);
tabunganRoutes.delete("/:id", tabunganController.remove);
