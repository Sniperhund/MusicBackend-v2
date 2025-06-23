import { z } from "@hono/zod-openapi"
import mongoose, { Schema } from "mongoose"

const genreSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
})

export const Genre = mongoose.model("Genre", genreSchema)

export const GenreZodSchema = z.object({
    name: z.string()
})
