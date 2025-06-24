import * as fsPath from "path"
import { rm } from "fs/promises"
import Ffmpeg from "fluent-ffmpeg"

if (!process.env.UPLOAD_DIR)
    throw new Error("Environment variable UPLOAD_DIR not found")

const uploadDir = process.env.UPLOAD_DIR

const calculatePath = async (filePath: string): Promise<string | undefined> => {
    try {
        const combinedPath = fsPath.join(uploadDir, filePath)

        if (!combinedPath.startsWith(uploadDir)) return undefined

        return combinedPath
    } catch {
        return undefined
    }
}

export const processAudioFile = async (filePath: string) => {
    if (!filePath) throw new Error("filePath is undefined")

    const fullPath = await calculatePath(filePath)

    if (!fullPath) throw new Error("filePath is invalid")

    const fileInfo = fsPath.parse(fullPath)

    const outputLowMp3 = fsPath.join(fileInfo.dir, "low.mp3")
    const outputMidMp3 = fsPath.join(fileInfo.dir, "mid.mp3")
    const outputLowAAC = fsPath.join(fileInfo.dir, "low.m4a")
    const outputMidAAC = fsPath.join(fileInfo.dir, "mid.m4a")

    await Promise.all([
        new Promise((resolve, reject) => {
            Ffmpeg(fullPath)
                .audioBitrate("128k")
                .toFormat("mp3")
                .audioCodec("libmp3lame")
                .on("end", resolve)
                .on("error", reject)
                .save(outputLowMp3)
        }),
        new Promise((resolve, reject) => {
            Ffmpeg(fullPath)
                .audioBitrate("256k")
                .toFormat("mp3")
                .audioCodec("libmp3lame")
                .on("end", resolve)
                .on("error", reject)
                .save(outputMidMp3)
        }),
        new Promise((resolve, reject) => {
            Ffmpeg(fullPath)
                .audioBitrate("96k")
                .toFormat("mp4")
                .audioCodec("aac")
                .on("end", resolve)
                .on("error", reject)
                .save(outputLowAAC)
        }),
        new Promise((resolve, reject) => {
            Ffmpeg(fullPath)
                .audioBitrate("192k")
                .toFormat("mp4")
                .audioCodec("aac")
                .on("end", resolve)
                .on("error", reject)
                .save(outputMidAAC)
        })
    ])
}

export const saveFile = async (filePath: string, file: Blob) => {
    if (!file) throw new Error("file is undefined")

    const path = await calculatePath(filePath)

    if (!path) throw new Error("filePath is invalid")

    await Bun.write(path, file, { createPath: true })
}

export const cleanFileOrDirectory = async (filePath: string) => {
    if (!filePath) throw new Error("filePath is undefined")

    const path = await calculatePath(filePath)

    if (!path) throw new Error("filePath is invalid")

    try {
        await rm(path, { recursive: true })
    } catch(error: any) {
        if (error.code === "ENOENT") {
            console.error("File or directory doesn't exist")
        } else {
            throw error
        }
    }
}

export const getAudioDuration = async (filePath: string): Promise<number> => {
    if (!filePath) throw new Error("filePath is undefined")

    const path = await calculatePath(filePath)

    if (!path) throw new Error("filePath is invalid")

    return new Promise((resolve, reject) => {
        Ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) return reject(0)

            if (metadata.format.duration)
                return resolve(metadata.format.duration)

            reject(0)
        })
    })
}
