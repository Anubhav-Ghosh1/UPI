import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

/*
getAccountBalance: Fetches the current account balance for a user.
addFunds: Allows users to add money to their account (e.g., via a linked bank or card).
withdrawFunds: Processes withdrawals to a linked bank account.
linkBankAccount: Allows users to link their bank account for UPI operations.
*/

const getAccountBalance = asyncHandler(async(req,res) => {
    try
    {
        const id = req.user?._id;
        if(!id)
        {
            return res.Transaction(400).json(new ApiResponse(400,{},"Id is required"));
        }
        const userDetails = await User.findById(id);
        if(!userDetails)
        {
            return res.status(400).json(new ApiResponse(400,{},"Error while getting user details"));
        }

        return res.status(200).json(new ApiResponse(200,userDetails.bankAccounts[0],"Account balance fetched successfully"));
    }
    catch(e)
    {
        return res.status(500).json(new ApiResponse(500,{},"Error while fetching account details"));
    }
});

const addFunds = asyncHandler(async (req,res) => {
    try
    {
        const id = req.user?._id;
        const {amount} = req?.body;
        if(!amount && amount < 0)
        {
            return res.status(400).json(new ApiResponse(400,{},"Amount is required"));
        }
        if(!id)
        {
            return res.Transaction(400).json(new ApiResponse(400,{},"Id is required"));
        }
        const userDetails = await User.findById(id);
        if(!userDetails)
        {
            return res.status(400).json(new ApiResponse(400,{},"Error while getting user details"));
        }

        const updatedUser = await User.findByIdAndUpdate(id,{
            $inc: {"bankAccounts.$.balance": amount}
        },{new: true});

        return res.status(200).json(new ApiResponse(200,updatedUser,"Updated user details"));
    }
    catch(e)
    {
        return res.status(500).json(new ApiResponse(500,{},"Error while updating balance"));
    }
})

export {getAccountBalance, addFunds};