import { app } from "./util/hono"
import { dbConnect } from "./util/database"

dbConnect()

app.get("/", (c) => {
    return c.json({ status: "ok" })
})

// Auth
import "routes/auth.route"

// Admin
import "routes/admin/genre.route"
import "routes/admin/track.route"
import "routes/admin/artist.route"
import "routes/admin/album.route"

// Fetch data
import "routes/artist.route"
import "routes/genre.route"
import "routes/album.route"
import "routes/track.route"

export default app
