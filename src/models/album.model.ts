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
    genres: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "Genre",
        }],
        required: true
    }
})

export const Album = mongoose.model("Album", albumSchema)
