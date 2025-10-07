import { Request, Response, NextFunction } from "express";
import { BigPromise } from "../middlewares/bigPromise";
//import Stripe from "stripe";
import { Currency, PrismaClient, Reason, TransactionStatus, TransactionType } from "@prisma/client";
import { razorpay } from "../services/razorPay";
import crypto from 'crypto'


const prisma = new PrismaClient();

interface CreateTransactionBody {
  amountRequested: number;
  email: string;
  name?: string;
  address?: string;
  currency?: string;
}


export const createRazorpayOrder = BigPromise(async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { amountRequested, email, currency } = req.body;

  if (!amountRequested || !email) {
    return _next(new Error( "amountRequested and email are required")) ;
  }

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return _next(new Error("User not found" ));

  const paymentCurrency = (currency || "INR").toUpperCase();

  // ✅ Create Razorpay order
  const options = {
    amount: Math.round(amountRequested * 100), // amount in paise
    currency: paymentCurrency,
    receipt: `receipt_${Date.now()}`,
    notes: {
      email: user.email,
      userId: user.id,
    },
  };

  const order = await razorpay.orders.create(options);

  // ✅ Log PENDING transaction
  await prisma.transactions.create({
    data: {
      id: order.id, // optional, or use uuid
      transactionType: TransactionType.CREDIT,
      amount: amountRequested,
      currency: paymentCurrency as Currency,
      status: TransactionStatus.PENDING,
      updatedAt: new Date(),
      product_name: "Wallet Top-Up",
      userId: user.id,
      reason: Reason.TOPUP,
      razorpay_order_id: order.id,
    },
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.TEST_RAZORPAY_KEY_ID,
  });
});


interface GetSessionQuery {
  sessionId?: string;
}



export const getUserInfo = BigPromise(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return  _next(new Error("Email is required as a query param"));
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return _next(new Error( "User not found")) ;
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);


export const getUserTransactions = BigPromise(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return  _next(new Error("Email is required as a query param")) ;
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return _next(new Error("User not found"));
    }

    const transactions = await prisma.transactions.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      transactions,
    });
  }
);

export const verifyRazorpayPayment = BigPromise(async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return _next(new Error("Payment details is missing"));
  }

  const generated_signature = crypto
    .createHmac("sha256", process.env.TEST_RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    console.error("Signature mismatch");
    await prisma.transactions.updateMany({
      where: { razorpay_order_id },
      data: { status: TransactionStatus.FAILED },
    });
    return _next(new Error("Invalid signature")) ;
  }

  // Payment verified — update balance
  const transaction = await prisma.transactions.findFirst({
    where: { razorpay_order_id },
  });

  if (!transaction) {
    return  _next(new Error("Transaction not found"));
  }

  await prisma.users.update({
    where: { id: transaction.userId },
    data: { balance: { increment: transaction.amount } },
  });

  await prisma.transactions.update({
    where: { id: transaction.id },
    data: {
      status: TransactionStatus.SUCCESS,
      razorpay_payment_id,
      razorpay_signature,
    },
  });

  console.log(`Wallet credited with ₹${transaction.amount} for user ${transaction.userId}`);

  res.status(200).json({ success: true });
});

export const handleRazorpayWebhook = BigPromise(async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const secret = process.env.TEST_RAZORPAY_WEBHOOK_SECRET!;
  const payload = JSON.stringify(req.body);
  const signature = req.headers['x-razorpay-signature'] as string;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (expectedSignature !== signature) {
    return  _next(new Error("Invalid webhook signature")) ;
  }

  const event = req.body;

  // Handle different events
  switch(event.event) {
    case 'payment.captured':
      {
        const { order_id, id: paymentId } = event.payload.payment.entity;

        // Mark transaction as SUCCESS
        const transaction = await prisma.transactions.findFirst({
          where: { razorpay_order_id: order_id },
        });

        if (transaction) {
          await prisma.transactions.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.SUCCESS,
              razorpay_payment_id: paymentId,
            },
          });

          // Credit user's wallet
          await prisma.users.update({
            where: { id: transaction.userId },
            data: { balance: { increment: transaction.amount } },
          });

          console.log(` Transaction SUCCESS for order ${order_id}`);
        }
      }
      break;

    case 'payment.failed':
      {
        const { order_id } = event.payload.payment.entity;

        // Mark transaction as FAILED
        await prisma.transactions.updateMany({
          where: { razorpay_order_id: order_id },
          data: { status: TransactionStatus.FAILED },
        });

        console.log(` Transaction FAILED for order ${order_id}`);
      }
      break;

    default:
      console.log(`Unhandled event: ${event.event}`);
  }

  res.status(200).json({ success: true });
});
