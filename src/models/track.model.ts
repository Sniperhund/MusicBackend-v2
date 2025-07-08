import { ZodCommaSeparatedMongooseIds, ZodMongooseId } from "@/util"
import { z } from "@hono/zod-openapi"
import mongoose, { Schema } from "mongoose"

const trackSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    album: {
        type: Schema.Types.ObjectId,
        ref: "Album",
        required: true
    },
    artists: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "Artist",
        }],
        required: true
    },
    fileDir: {
        type: String,
        required: true
    },
    durationInSeconds: {
        type: Number,
        required: true
    },
    lyrics: {
        type: {
            synced: {
                type: Boolean,
                required: true
            },
            text: {
                type: String,
                required: true
            }
        }
    }
})

export const Track = mongoose.model("Track", trackSchema)

export const TrackZodSchema = z.object({
    name: z.string(),
    album: ZodMongooseId,
    artists: ZodCommaSeparatedMongooseIds,
    file: z.file().openapi({
        type: "string",
        format: "binary"
    }),
    lyrics: z.union([
        z.object({
            synced: z.boolean(),
            text: z.string()
        }),
        z.string()
    ]).optional()
})
