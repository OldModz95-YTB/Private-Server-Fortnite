const express = require("express")
const crypto = require("crypto")
const path = require("path")
const app = express.Router()


app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/../public/html/home.html")))

app.get("/download", (req, res) => res.sendFile(path.join(__dirname, "/../public/html/download.html")))

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "/../public/html/login.html")))

app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "/../public/html/signup.html")))

app.get("/account", (req, res) => res.sendFile(path.join(__dirname, "/../public/html/account.html")))

app.use('/js', express.static(`${__dirname}/../public/js/`))

app.use('/css', express.static(`${__dirname}/../public/css/`))

app.use('/files', express.static(`${__dirname}/../public/files/`))

app.use("/id", require(`${__dirname}/id.js`))

module.exports = app