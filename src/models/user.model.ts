import { FormatOutputZodSchema } from "@/util"
import { z } from "@hono/zod-openapi"
import mongoose, { Schema } from "mongoose"
import parse from "parse-duration"
import { TrackZodSchema } from "./track.model"

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
        required: true,
        select: false
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
        required: true,
        select: false
    },
    verified: {
        type: Boolean,
        default: false,
        required: true,
        select: false
    },
    savedTracks: [
        {
            type: Schema.Types.ObjectId,
            ref: "Track"
        }
    ]
}, { timestamps: true })

export const User = mongoose.model("User", userSchema)

export const UserZodSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
})

export const UserOutputZodSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
    verified: z.coerce.boolean(),
    savedTracks: z.array(FormatOutputZodSchema(TrackZodSchema))
})

export const sessionTTL = parse(process.env.TOKEN_EXPIRE || "1h") || 3600000

const sessionSchema = new Schema({
    token: {
        type: String,
        default: () => crypto.randomUUID(),
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: Math.floor(sessionTTL / 1000) },
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

export const Session = mongoose.model("Session", sessionSchema)
