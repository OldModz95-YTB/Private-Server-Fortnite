const express = require("express")
const crypto = require("crypto")
const app = express.Router()
const path = require("path")
const fs = require("fs")

const checkClientToken = require(`${__dirname}/../../middleware/checkClientToken`)
const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const errors = require(`${__dirname}/../../structs/errors`)

const uniqueFilenames = {
    "DefaultRuntimeOptions.ini": "c52c1f9246eb48ce9dade87be5a66f29",
    "DefaultGame.ini": "a22d837b6a2b46349421259c0a5411bf",
    "WindowsClient_Game.ini": "7e2a66ce68554814b1bd0aa14351cd71",
    "WindowsClient_RuntimeOptions.ini": "b800b911053c4906a5bd399f46ae0055",
    "WindowsClient_Engine.ini": "b6c60402a72e4081a6a47c641371c19f",
    "DefaultEngine.ini": "3460cbe1c57d4a838ace32951a4d7171"
}


app.get("/api/cloudstorage/system", checkClientToken, (req, res) => {
    if (req.headers["user-agent"].split("-")[1].includes("13.40")) {
        res.status(404).end()
        return
    }

    var files = fs.readdirSync(`${__dirname}/../../cloudstorage`)

    files = files.map(x => {
        var file = fs.readFileSync(`${__dirname}/../../cloudstorage/${x}`)
        
        return {
            uniqueFilename: uniqueFilenames[x],
            filename: x,
            hash: crypto.createHash("sha1").update(file).digest("hex"),
            hash256: crypto.createHash("sha256").update(file).digest("hex"),
            length: file.length,
            contentType: "application/octet-stream",
            uploaded: fs.statSync(`${__dirname}/../../cloudstorage/${x}`).mtime,
            storageType: "S3",
            doNotCache: false
        }
    })

    res.json(files)
})

app.get("/api/cloudstorage/system/:filename", checkClientToken, (req, res) => {
    const reversed = {}
    Object.keys(uniqueFilenames).forEach(x => reversed[uniqueFilenames[x]] = x)

    if (!reversed[req.params.filename]) return res.status(404).json(
        error.create(
            "errors.com.epicgames.cloudstorage.file_not_found", 12004, // Code
            `Sorry, we couldn't find a system file for ${req.params.filename}`, // Message

            "fortnite", "prod-live", // Service & Intent

            [req.params.filename] // Variables
        )
    )
    res.setHeader("content-type", "application/octet-stream")
    res.sendFile(path.join(__dirname, `/../../cloudstorage/${reversed[req.params.filename]}`))
})

app.get("/api/cloudstorage/user/:accountId", checkToken,  (req, res) => res.json([]))

app.get("/api/cloudstorage/user/:accountId/:filename", checkToken,  (req, res) => res.status(204).send())

app.put("/api/cloudstorage/user/:accountId/:filename", checkToken, (req, res) => res.status(204).send())


module.exports = app