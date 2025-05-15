import { OpenAPIHono } from "@hono/zod-openapi"
import { swaggerUI } from "@hono/swagger-ui"

export const app = new OpenAPIHono()

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
})

app.get("/docs", swaggerUI({ url: "/schema" }))

app.doc("/schema", {
    info: {
        title: "MusicBackend",
        version: "v2",
    },
    openapi: "3.1.0"
})
