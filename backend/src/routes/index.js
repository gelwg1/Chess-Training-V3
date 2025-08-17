import { Router } from "express";
import puzzlesController from "../controller/puzzlesController.js";

const router = Router();

router.get("/puzzles", puzzlesController.getAllPuzzles);

export default router;
