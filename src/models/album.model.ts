import { ZodCommaSeparatedMongooseIds, ZodMongooseId } from "@/util"
import { z } from "@hono/zod-openapi"
import mongoose, { Schema } from "mongoose"

const albumSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    artists: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "Artist",
        }],
        required: true
    },
    file: {
        type: String,
        required: true
    },
    genre: {
        type: Schema.Types.ObjectId,
        ref: "Genre",
        required: true
    }
})

export const Album = mongoose.model("Album", albumSchema)

export const AlbumZodSchema = z.object({
    name: z.string(),
    artists: ZodCommaSeparatedMongooseIds,
    file: z.file().openapi({
        type: "string",
        format: "binary"
    }),
    genre: ZodMongooseId
})
