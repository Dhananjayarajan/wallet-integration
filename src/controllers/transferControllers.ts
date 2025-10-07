import { Request, Response, NextFunction } from "express";
import { BigPromise } from "../middlewares/bigPromise";
import { PrismaClient, TransactionStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface TransferForm {
  email: string;
  fromWallet: string;
  toWallet: string;
  balance: number;
}

export const createTransfer = BigPromise(
  async (req: Request<{}, {}, TransferForm>, res: Response, _next: NextFunction) => {
    const { email, fromWallet, toWallet, balance } = req.body;

    if (!email || !fromWallet || !toWallet || !balance) {
      return _next(new Error("Please fill all required fields"));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return _next(new Error("User not found"));
    }

    const validWallet: Record<string, keyof typeof user> = {
      balance: "balance",
      ai_avatar_balance: "ai_avatar_balance",
      meta_ad_balance: "meta_ad_balance",
      data_scrap_balance: "data_scrap_balance",
      broadcast_bot_balance: "broadcast_bot_balance",
    };

    if (!(fromWallet in validWallet) || !(toWallet in validWallet)) {
      return _next(new Error("Invalid wallet names provided"));
    }

    const fromKey = validWallet[fromWallet];
    const toKey = validWallet[toWallet];

    const fromBalance = new Prisma.Decimal(user[fromKey] as any);
    const transferAmount = new Prisma.Decimal(balance);

    if (fromBalance.lessThan(transferAmount)) {
      return _next(new Error("Insufficient balance in source wallet"));
    }

    const updatedUser = await prisma.users.update({
      where: { email },
      data: {
        [fromKey]: fromBalance.sub(transferAmount),
        [toKey]: new Prisma.Decimal(user[toKey] as any).add(transferAmount),
      },
    });

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  }
);
