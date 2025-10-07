
import { Router } from "express";
import { createTransfer } from "../controllers/transferControllers";

const router = Router();

router.post("/create-transfer", createTransfer)

export default router;
