import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    eloRating: {
        type: Number,
        default: 1200
    },
    isTop12: {
        type: Boolean,
        default: false
    },
    badges: [{
        type: String
    }],
    matchHistory: [{
        opponent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        result: {
            type: String,
            enum: ["win", "loss", "draw"]
        },
        ratingChange: Number
    }]
}, {timestamps: true});

export default mongoose.model("User", userSchema);