const express = require("express")
const app = express.Router()
const fs = require("fs")

const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const cache = require(`${__dirname}/../../structs/caching`)
const errors = require(`${__dirname}/../../structs/errors`)

app.use(require(`${__dirname}/cloudstorage.js`))
app.use(require(`${__dirname}/timeline.js`))
app.use(require(`${__dirname}/mcp.js`))

app.all("/api/v2/versioncheck/Windows", (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.json({type: "NO_UPDATE"})
})

app.all("/api/game/v2/tryPlayOnPlatform/account/:accountId", checkToken, (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.setHeader('Content-Type', 'text/plain')
    res.send(true)
})

app.all("/api/game/v2/enabled_features", checkToken,  (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.json([])
})

app.all("/api/storefront/v2/keychain", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))

    res.json(cache.getKeychain())
})

app.all("/api/game/v2/matchmakingservice/ticket/player/:accountId", checkToken, (req, res) => {
    res.status(401).json(errors.create(
        "Due to Epic TOS, we are not able to support matchmaking. Sorry for any inconvenience.", 12002,
        "dev.slushia.fdev.matchmaking.not_enabled",
        "fortnite", "prod"
    ))
})

app.all("/api/game/v2/privacy/account/:accountId", checkToken, (req, res) => {
    res.json({
        acceptInvites: "public"
    })
})

app.all("/api/game/v2/world/info", checkToken, (req, res) => {
    res.json({})
})

app.all("/api/matchmaking/session/findPlayer/:accountId", (req, res) => {
    res.status(204).end()
})

app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "fortnite", "prod"
    ))
})

module.exports = app