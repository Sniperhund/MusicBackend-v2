import mongoose, { Schema } from "mongoose"
import parse from "parse-duration"

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        required: true
    },
    refreshToken: {
        // TODO: Maybe implement whole schema for refresh tokens to make it possible to invalidate only one client
        type: String,
        default: () => crypto.randomUUID(),
        required: true
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    savedTracks: [
        {
            type: Schema.Types.ObjectId,
            ref: "Track"
        }
    ]
})

export const User = mongoose.model("User", userSchema)

const sessionTTL = parse(process.env.TOKEN_EXPIRE || "1h") || 3600000

const sessionSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: Math.floor(sessionTTL / 1000) }
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

export const Session = mongoose.model("Session", sessionSchema)
