import mongoose, { Schema } from "mongoose"

const genreSchema = new Schema({
    name: {
        type: String,
        required: true
    }
})

export const Genre = mongoose.model("Genre", genreSchema)
