Centralized wallet Documentation

Wallet system is a separate microservices that is not depending on any other existing projects and can easily with any of our saas products
Features

1. Customer can add money with their convenient payment method example UPI, Netbanking etc
2. This wallet is centralized so customers can add money and spend it on any of our products like ai avatar, broadcasting bot.
3. Customer also can set limit of spending if they budget for any of the products (example customer can add 50K in wallet and make limit of 10K for AI avatar for one month. So after 10K spent, AI avatar will not work because it exceeds limit)
   Working Principle
4. In Diginest or any other saas product there will be wallet icon given and total balance is shown by default usually at top left side
5. If customer hover over or click that wallet, it shows total balance and split up balance.
6. There are 2 more options called Add balance and Transfer balance
7. If customer clicks add balance button they will have option to pay with UPI, card, net banking etc.
8. If customer want to transfer balance from one wallet to another wallet, they simply can use transfer balance button and choose from and to destination and balance will be successfully transferred
9. We will deduct the amount as per our pricing policy and stop the service if the balance went to 0
   Important Note
   To make this wallet work for your customers, they must create a new wallet account. Instead of creating them separately, Developer should create an entry in this wallet db using below apis.
   For existing customers we need to fetch the data from database and create a new user by entering them manually
   Technical Documentation
   This section is written only for developers to know how api works. This same documentation will be provide in GitHub readme file too.
   Technologies we used
10. Node.js
11. Npm
12. Express.js
13. Typescript
14. Postgresql
15. Prisma ORM
16. Razorpay
    Important security notes
    In this wallet we are not doing any middleware checks. We use cors policies and update the url in CORS so this wallet will accept any api request from the authorized end points
    To improve security, you must include your own logics such as middleware checks, issuing jwt in your controller.
    Database Design
    We have 2 tables called Users and Transactions. Transactions table will have many to one relationship with users

Below provided the Database Schema including 2 tables and the enums

model users {
id String @id
email String @unique
balance Decimal @default(0)
lockedBalance Decimal @default(0)
currency Currency @default(INR)
createdAt DateTime @default(now())
updatedAt DateTime
ai_avatar_balance Decimal @default(0)
broadcast_bot_balance Decimal @default(0)
data_scrap_balance Decimal @default(0)
meta_ad_balance Decimal @default(0)
transactions transactions[]
}

model transactions {
id String @id
transactionType TransactionType
amount Decimal
currency Currency @default(INR)
product_name String?
status TransactionStatus
metadata Json?
referenceId String? @unique
createdAt DateTime @default(now())
updatedAt DateTime
userId String
relatedTransactionId String?
razorpay_order_id String?
razorpay_payment_id String?
razorpay_signature String?
wallet ProductWallet?
reason Reason
transactions transactions? @relation("transactionsTotransactions", fields: [relatedTransactionId], references: [id])
other_transactions transactions[] @relation("transactionsTotransactions")
users users @relation(fields: [userId], references: [id])

    @@index([referenceId])
    @@index([status, createdAt])
    @@index([userId, createdAt])

}

enum Currency {
USD
INR
EUR
GBP
}

enum ProductWallet {
AI_AVATAR
BROADCAST_BOT
META_AD
DATA_SCRAP
}

enum Reason {
TOPUP
REFUND
SPENT
CANCELLED
ERROR
TRANSFER
}

enum TransactionStatus {
PENDING
SUCCESS
FAILED
CANCELLED
}

enum TransactionType {
DEBIT
CREDIT
}

API Endpoints
/api/v1/create-user

1. Used to create a new user inside user’s table
   a. Expected payload : req.body
   i. email : string
   ii. currency : Currency type(mentioned in enum above) optional defaulted to INR
   b. Returns
   i. Success : true
   ii. Newly created user
   /api/v1/create-session
1. This route is responsible for the customer to make payment
   a. Expected payload : req.body
   i. amountRequested : number (amount which customer wants to add in the wallet)
   ii. email : string
   iii. name : string (optional)
   iv. address : string (optional)
   v. currency : Currency type(mentioned in enum above) optional defaulted to INR
   b. Returns
   i. Success : true
   ii. sessionId : the actual session id created
   /api/v1/user-info
1. This route will get the info about a particular user in the database with the user’s email id
   a. Expected payload : req.query
   i. email : string
   b. Returns
   i. Entire user object including wallet balance, sub balance in different products etc
   /api/v1/user-transactions
1. This route is used to get all the transactions of a particular user(useful while generating statements)
   a. Expected payload : req.query
   i. Email : string
   b. Returns
   i. Array of all transactions for a requested user
   /api/v1/create-transfer
1. Expected payload : req.body
   a. email : string
   b. fromWallet : ProductWallet enum (must be from enum)
   c. balance : number (how much customer wanted to transfer)
   d. toWallet : ProductWallet enum (must be from enum)
1. Returns
   a. Success : true
   b. That transaction object

Examples of request and response

POST /api/v1/create-user
{
"email": "test@example.com",
"currency": "INR"
}
Response:
{
"success": true,
"user": {
"id": "abc123",
"email": "test@example.com",
"balance": 0,
"currency": "INR"
}
}
/api/v1/create-transfer
{
"email": "user@example.com",
"fromWallet": "AI_AVATAR",
"toWallet": "BROADCAST_BOT",
"balance": 500
}
Response:
{
"success": true,
"transaction": {
"id": "txn_123",
"transactionType": "TRANSFER",
"amount": 500,
"fromWallet": "AI_AVATAR",
"toWallet": "BROADCAST_BOT",
"status": "SUCCESS",
"createdAt": "2025-10-03T08:30:00Z"
}
}
Sample data from Database
User Object

    	"user": {
    			"id": "f7e40fa4-6b9e-4573-9b60-592467cfa682",
    			"email": "dhananjayarajan@gmail.com",
    			"balance": "2020",
    			"lockedBalance": "0",
    			"currency": "INR",
    			"createdAt": "2025-09-30T10:53:33.341Z",
    			"updatedAt": "2025-10-03T08:31:38.411Z",
    			"ai_avatar_balance": "300",
    			"broadcast_bot_balance": "0",
    			"data_scrap_balance": "0",
    			"meta_ad_balance": "0"
    	}

Transaction Object

    			{
    					"id": "order_RPIBQxbBc805z4",
    					"transactionType": "CREDIT",
    					"amount": "100",
    					"currency": "INR",
    					"product_name": "Wallet Top-Up",
    					"status": "SUCCESS",
    					"metadata": null,
    					"referenceId": null,
    					"createdAt": "2025-10-04T06:11:17.948Z",
    					"updatedAt": "2025-10-04T06:11:17.946Z",
    					"userId": "f7e40fa4-6b9e-4573-9b60-592467cfa682",
    					"relatedTransactionId": null,
    					"razorpay_order_id": "order_RPIBQxbBc805z4",
    					"razorpay_payment_id": "pay_RPIBwR9dwhmoOp",
    					"razorpay_signature": "61640f46a85ec3c3bba100cc925b1c4d82df95aab55769dfbe99e76cba8f0507",
    					"wallet": null,
    					"reason": "TOPUP"
    			},
