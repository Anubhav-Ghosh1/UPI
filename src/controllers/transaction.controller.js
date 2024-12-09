import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse";

/*
    initiateTransaction: Creates a new transaction request between a sender and a receiver.
    completeTransaction: Verifies and completes the transaction by updating balances.
    getTransactionHistory: Retrieves the history of transactions for a specific user.
    cancelTransaction: Cancels a pending transaction if not yet completed.
*/

const initiateTransaction = asyncHandler(async(req,res) => {
    try
    {
        //  Creates a new transaction request 
        // between a sender and a receiver.
        const id = req.user?._id;
        const {receiverUpiId, amount} = req.body;
        if(!receiverUpiId || !amount)
        {
            return res.status(400).json(new ApiResponse(400,{},"All fields are required"));
        }

        if(!id)
        {
            return res.Transaction(400).json(new ApiResponse(400,{},"Id is required"));
        }

        const userDetails = await User.findById(id);
        const receiverDetails = await Transaction.findOne({upiId: receiverUpiId});
        
        if(!userDetails)
        {
            return res.status(400).json(new ApiResponse(400,{},"Error while getting user details"));
        }

        const senderBalance = await userDetails.bankAccounts[0].balance;
        const receiverBalance = receiverDetails.bankAccounts[0].balance;

        if(senderBalance < amount)
        {
            await Transaction.create({
                senderUpiId: userDetails?.upiId,
                receiverUpiId: receiverUpiId,
                amount: amount,
                status: "failed",
            })
            return res.status(200).json(new ApiResponse(200,transaction,"Insuficient Balance"))
        }

        const transaction = await Transaction.create({
            senderUpiId: userDetails?.upiId,
            receiverUpiId: receiverUpiId,
            amount: amount,
            status: "pending",
        });

        // ensuring ACID property
        const session = await User.startSession();
        session.startTransaction();

        try
        {
            const updatedReceiver = await Transaction.findByIdAndUpdate(receiverDetails._id,{
                $inc: { "bankAccounts.$.balance": amount },
            },{new: true});
    
            // "bankAccounts.$.balance": amount: The $ operator refers to the first array element
    
            const updatedSender = await User.findByIdAndUpdate(id,{
                $inc: {"bankAccounts.$.balance": -amount}
            },{new: true});
    
            transaction.status = "success";
            transaction.save();
    
            return res.status(200).json(new ApiResponse(200,{transaction,sendersBalance: updatedSender.bankAccounts[0].balance},"Transaction is created successfully"));
        }
        catch(e)
        {
            await session.abortTransaction();
            session.endSession();
            transaction.status = "failed";
            await transaction.save();
        }
    }
    catch(e)
    {
        return res.status(500).json(new ApiResponse(500,{},e?.message || "Error while creating transaction"))
    }
});

export {initiateTransaction};