import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mailSender } from "../utils/mail.js";


const createPaymentRequest = asyncHandler(async (req,res) => {
    try
    {
        const {receiversUPIId, amount} = req.body;
        if(!receiversUPIId)
        {
            return res.status(400).json(new ApiResponse(400,{},"Receiver UPI Id is required"));
        }

        if(!amount)
        {
            return res.status(400).json(new ApiResponse(400,{},"Amount is required"));
        }

        const id = req?.user?._id;
        if(!id)
        {
            return res.status(400).json(new ApiResponse(400,{},"All fields are required"));
        }

        const userDetails = await User.findById(id);

        const receiverDetails = await User.findOne({upiId: receiversUPIId});
        await mailSender(receiverDetails.email,`Payment Requested of ${amount} by ${userDetails?.name}`); // mail template

        const transaction = await Transaction.create({
            senderUpiId: userDetails?.upiId,
            receiverUpiId: receiverDetails?.upiId,
            amount: amount,
            status: "pending",
        });

        return res.status(200).json(new ApiResponse(200,transaction,"Requested created successfully"));
    }
    catch(e)
    {
        return res.status(500).json(new ApiResponse(500,{},"Error while creating request"));
    }
});

export {createPaymentRequest};