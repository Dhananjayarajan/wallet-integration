//This route is only for testing purposes do not send any request to this route

import { Router } from "express";

import { createUser } from "../controllers/userControllers";

const router = Router();

router.route('/create-user').post(createUser)

export default router;


