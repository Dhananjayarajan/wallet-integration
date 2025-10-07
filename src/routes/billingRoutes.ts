import { Router } from "express";

import { getUserInfo, getUserTransactions, verifyRazorpayPayment, createRazorpayOrder, handleRazorpayWebhook, debitMoneyForUse } from "../controllers/paymentControllers";

const router = Router();

router.route('/create-session').post(createRazorpayOrder)
router.route("/user-info").get(getUserInfo);
router.route("/user-transactions").get(getUserTransactions);
router.route("/verify-razorpay-order").post(verifyRazorpayPayment);
router.route("/razorpay-webhook").post(handleRazorpayWebhook)
router.route('/debit-money').post(debitMoneyForUse)

export default router;

