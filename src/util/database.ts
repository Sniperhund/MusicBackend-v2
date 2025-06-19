import mongoose from "mongoose"

export const dbConnect = () => {
    if (!process.env.MONGODB_URI)
        throw new Error("Environment variable MONGODB_URI not found")

    mongoose.connect(process.env.MONGODB_URI)

    mongoose.connection.on("connected", () => {
        console.log("Database connected")
    })

    mongoose.connection.on("error", (err) => {
        console.error("Database connection error:", err)
    })
}
