import { z } from "@hono/zod-openapi"
import mongoose from "mongoose"
import { Model, Types, InferSchemaType } from "mongoose"

export async function findDependents<
M extends Model<any>,
Field extends keyof InferSchemaType<M["schema"]>
>(model: M, field: Field, value: Types.ObjectId) {
    const filter: Record<string, unknown> = {
        [field as string]: value
    }

    return await model.find(filter).select("_id name")
}

export const ZodForceDeletion = z.boolean().describe("Will delete all dependents automatically")

export const SecurityObject = {
    security: [
        {
            Bearer: []
        }
    ]
}

export const FormatOutputZodSchema = (schema: z.ZodObject<any>) => {
    return schema.extend({
        _id: z.string()
    })
}

export const ZodMongooseId = z.coerce.string().refine(
    (val) => mongoose.isValidObjectId(val),
    {
        message: "Invalid id"
    }
)

export const ZodCommaSeparatedMongooseIds = z.coerce.string().transform(
    (val) => val.split(",").map((id) => id.trim()).filter(Boolean)
).refine((ids) => ids.every((id) => mongoose.isValidObjectId(id)), {
    message: "One or more ID(s) are invalid"
}).openapi({
    type: "array"
})

export const ZodQueryUnionMongooseIds = z.object({
    ids: z.union([
        ZodMongooseId.array(),
        ZodMongooseId
    ])
})
