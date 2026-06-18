import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard", "Extreme"]
    },
    description: {
        type: String,
        required: true
    },
    timeLimit: {
        type: Number,
        default: 1.0
    },
    memoryLimit: {
        type: Number,
        default: 256
    },
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: {
            type: Boolean,
            default: false
        }
    }]
});

export default mongoose.model("Problem", problemSchema);