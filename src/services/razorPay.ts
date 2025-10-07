import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.TEST_RAZORPAY_KEY_ID!,
  key_secret: process.env.TEST_RAZORPAY_KEY_SECRET!,
});
