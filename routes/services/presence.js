const express = require('express')
const app = express.Router()

const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const errors = require(`${__dirname}/../../structs/errors`)

app.all("/api/v1/_/:accountId/settings/subscriptions", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/api/v1/_/:accountId/last-online", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/api/v1/_/:accountId/subscriptions", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/api/v1/Fortnite/:accountId/subscriptions/nudged", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "presence", "prod"
    ))
})

module.exports = app
