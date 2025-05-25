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
    file: {
        type: String,
        required: true
    },
    durationInSeconds: {
        type: Number,
        required: true
    }
})

export const Track = mongoose.model("Track", trackSchema)
