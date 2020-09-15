const express = require("express")
const app = express.Router()

const errors = require(`${__dirname}/../../structs/errors`)

app.all("/api/v1/public/data", (req, res) => res.status(204).end())

app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "datarouter", "prod"
    ))
})
module.exports = app