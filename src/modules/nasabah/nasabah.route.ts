import { Router } from "express";
import { nasabahController } from "./nasabah.controller";
import { authenticate } from "../../middleware/auth";

export const nasabahRoutes = Router();

// Publik (registrasi)
nasabahRoutes.post("/", nasabahController.create);

// Butuh JWT
nasabahRoutes.get("/", authenticate, nasabahController.findAll);
nasabahRoutes.get("/:id", authenticate, nasabahController.findById);
nasabahRoutes.patch("/:id", authenticate, nasabahController.update);
nasabahRoutes.delete("/:id", authenticate, nasabahController.remove);
