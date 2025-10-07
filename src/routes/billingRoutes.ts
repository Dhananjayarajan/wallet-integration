import { Router } from "express";

import { getUserInfo, getUserTransactions, verifyRazorpayPayment, createRazorpayOrder, handleRazorpayWebhook } from "../controllers/paymentControllers";

const router = Router();

router.route('/create-session').post(createRazorpayOrder)
router.route("/user-info").get(getUserInfo);
router.route("/user-transactions").get(getUserTransactions);
router.route("/verify-razorpay-order").post(verifyRazorpayPayment);
router.route("/razorpay-webhook").post(handleRazorpayWebhook)

export default router;

