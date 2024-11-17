import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    senderUpiId: {
        type: String,
        required: true,
    },
    receiverUpiId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const Transaction = mongoose.model("Transaction",transactionSchema);