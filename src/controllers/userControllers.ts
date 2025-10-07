import { Request, Response, NextFunction } from "express";
import { BigPromise } from "../middlewares/bigPromise";
import { Currency, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UserForm {
  email: string;
  currency?: string; 
}

export const createUser = BigPromise(
  async (req: Request<{}, {}, UserForm>, res: Response, _next: NextFunction) => {
    const { email, currency } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return _next(new Error("User already exists"));
    }

    let userCurrency: Currency;
    if (currency && Object.values(Currency).includes(currency as Currency)) {
      userCurrency = currency as Currency;
    } else {
      userCurrency = Currency.INR;
    }

    const newUser = await prisma.users.create({
      data: {
        email,
        currency: userCurrency,
      },
    });

    res.status(201).json({
      success: true,
      newUser,
    });
  }
);
