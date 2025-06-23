import { app } from "./util/hono"
import { dbConnect } from "./util/database"

dbConnect()

app.get("/", (c) => {
    return c.json({ status: "ok" })
})

import "routes/auth.route"
import "routes/admin/genre.route"

export default app
