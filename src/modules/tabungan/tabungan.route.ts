import { Router } from "express";
import { tabunganController } from "./tabungan.controller";

export const tabunganRoutes = Router();

tabunganRoutes.post("/", tabunganController.create);
tabunganRoutes.get("/", tabunganController.findAll);
tabunganRoutes.get("/:id", tabunganController.findById);
tabunganRoutes.patch("/:id", tabunganController.update);
tabunganRoutes.delete("/:id", tabunganController.remove);
