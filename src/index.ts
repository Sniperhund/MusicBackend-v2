import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { cors } from "hono/cors"
import { app } from "./util/hono"

app.use(cors())
app.use(logger())
app.use(prettyJSON())

app.get("/", (c) => {
    return c.json({ status: "ok" })
})

export default app
