import { z } from "@hono/zod-openapi"
import mongoose, { Schema } from "mongoose"

const artistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: true
    }
})

export const Artist = mongoose.model("Artist", artistSchema)

export const ArtistZodSchema = z.object({
    name: z.string(),
    file: z.file().openapi({
        type: "string",
        format: "binary"
    })
})
