import { app } from "./util/hono"
import { dbConnect } from "./util/database"

dbConnect()

app.get("/", (c) => {
    return c.json({ status: "ok" })
})

import "routes/auth.route"
import "routes/admin/genre.route"
import "routes/admin/track.route"
import "routes/admin/artist.route"

export default app
