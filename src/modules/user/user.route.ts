import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate } from "../../middleware/auth";

export const userRoutes = Router();

// Publik
userRoutes.post("/login", userController.login);
userRoutes.post("/", userController.create);

// Butuh JWT
userRoutes.post("/logout", authenticate, userController.logout);
userRoutes.get("/", authenticate, userController.findAll);
userRoutes.get("/:id", authenticate, userController.findById);
userRoutes.patch("/:id", authenticate, userController.update);
userRoutes.delete("/:id", authenticate, userController.remove);
