const config = require(`${__dirname}/../../config.json`)
const request = require("request")
const express = require("express")
const bcrypt = require("bcrypt")
const app = express.Router()

const User = require(`${__dirname}/../../model/User`)

const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const jwt = require(`${__dirname}/../../structs/jwt`)
const errors = require(`${__dirname}/../../structs/errors`)


Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

app.get("/api/epicdomains/ssodomains", (req, res) => res.json([]))

app.all("/api/oauth/token", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("com.epicgames.account.public", "prod"))

    var user
    var clientId

    try {
        clientId = Buffer.from(req.headers.authorization.split(" ")[1], "base64").toString().split(":")[0]
    } catch {
        return res.status(400).json(errors.create(
            "errors.com.epicgames.common.oauth.invalid_client", 1011,
            "It appears that your Authorization header may be invalid or not present, please verify that you are sending the correct headers.",
            "com.epicgames.account.public", "prod", []
        ))
    }
 
    switch (req.body.grant_type) {
        case "client_credentials":
            var token = jwt.createClient(clientId)
            if (clientTokens.find(x => x.ip == req.headers["x-real-ip"] || req.ip)) clientTokens.splice(clientTokens.findIndex(x => x.ip == req.headers["x-real-ip"] || req.ip), 1)
            clientTokens.push({
                ip: req.headers["x-real-ip"] || req.ip,
                token: `eg1~${token}`,
            })

            return res.json({
                access_token: `eg1~${token}`,
                expires_in: 14400,
                expires_at: new Date().addHours(4),
                token_type: "bearer",
                client_id: clientId,
                internal_client: true,
                client_service: "fortnite"
            })
            break;
        case "exchange_code":
            if (!req.body.exchange_code) return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `exchange_code is required.`,
                "com.epicgames.account.public", "prod", []
            ))

            if (!exchangeCodes[req.body.exchange_code]) return res.status(400).json(errors.create(
                "errors.com.epicgames.account.oauth.exchange_code_not_found", 18057,
                "Sorry the exchange code you supplied was not found. It is possible that it was no longer valid",
                "com.epicgames.account.public", "prod", []
            ))

            user = await User.findOne({id: exchangeCodes[req.body.exchange_code]}).lean();
            break;
        case "refresh_token":
            if (!req.body.refresh_token) return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `refresh_token is required.`,
                "com.epicgames.account.public", "prod", []
            ))

            if (!accessTokens.find(x => x.refresh == req.body.refresh_token)) return res.status(400).json(errors.create(
                "errors.com.epicgames.account.auth_token.invalid_refresh_token", 18036,
                `Sorry the refresh token '${req.body.refresh_token}' is invalid`,
                "com.epicgames.account.public", "prod"
            ))

            user = await User.findOne({id: accessTokens.find(x => x.refresh == req.body.refresh_token).id}).lean();
            break;
        case "password":
            var bIsValid = req.body.username && req.body.password

            if (!bIsValid) return errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `${req.body.username ? "password" : "username"} is required.`,
                "com.epicgames.account.public", "prod", []
            )

            user = await User.findOne({email: new RegExp(`^${req.body.username}$`, 'i') }).lean();

            if (!user ? true : !bcrypt.compareSync(req.body.password, user.password)) return res.status(401).json(errors.create(
                "errors.com.epicgames.account.invalid_account_credentials", 18031,
                "Sorry the account credentials you are using are invalid",
                "com.epicgames.account.public", "prod", []
            ))
            break;
        default:
            return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.unsupported_grant_type", 1016,
                `Unsupported grant type: ${req.body.grant_type}`,
                "com.epicgames.account.public", "prod", []
            ))
            break;
    }

    
    var token = jwt.createNormal(req.body.grant_type, user.id, user.displayName, clientId)
    var refresh = jwt.createRefresh(req.body.grant_type, user.id, clientId)

    if (accessTokens.find(x => x.id == user.id)) accessTokens.splice(accessTokens.findIndex(x => x.id == user.id), 1)
    accessTokens.push({
        id: user.id,
        token: `eg1~${token}`,
        refresh: `eg1~${refresh}`,
    })

    res.json({
        access_token: `eg1~${token}`,
        expires_in: 28800,
        expires_at: new Date().addHours(8),
        token_type: "bearer",
        refresh_token: `eg1~${refresh}`,
        refresh_expires: 115200,
        refresh_expires_at: new Date().addHours(32),
        account_id: user.id,
        client_id: clientId,
        internal_client: true,
        client_service: "fortnite",
        scope: [],
        displayName: user.displayName,
        app: "fortnite",
        in_app_id: user.id
    })
})
  
// token killing

app.all("/api/oauth/sessions/kill/:accessToken", checkToken, (req, res) => {
    if (req.method != "DELETE") return res.status(405).json(errors.method())

    var check1 = accessTokens.find(x => x.token == req.params.accessToken)
    var check2 = clientTokens.find(x => x.token == req.params.accessToken)

    if (!check1 && !check2) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.auth_token.unknown_oauth_session", 18051,
        `Sorry we could not find the auth session '${req.params.accessToken}'`,
        "com.epicgames.account.public", "prod", [req.params.accessToken] 
    ))

    if (check1) {
        if (parties.find(x => x.members.includes(check1.id))) {
            var party = parties.find(x => x.members.includes(check1.id))

            party.party.removeMember(check1.id)
        }
        accessTokens.splice(accessTokens.findIndex(x => x.token == req.params.accessToken), 1)
    }
    if (check2) {
        clientTokens.splice(clientTokens.findIndex(x => x.token == req.params.accessToken), 1)
    }
    res.status(204).end()
})


// account lookup

app.all("/api/public/account/:accountId", checkToken, async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({id: req.params.accountId}).lean();

    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })
    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.get('/api/public/account/:accountId/externalAuths', checkToken, (req, res) => res.json({}))


app.all("/api/public/account/displayName/:displayName" , async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({displayName: new RegExp(`^${req.params.displayName}$`, 'i') }).lean();

    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })
    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.displayName}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.all("/api/public/account/email/:email", checkToken, async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({email: new RegExp(`^${req.params.email}$`, 'i') }).lean();

    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })

    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.displayName}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.all("/api/public/account", checkToken, async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())

    if (req.query.accountId ? req.query.accountId.length > 100 : true) return res.status(400).json(errors.create(
        "errors.com.epicgames.account.invalid_account_id_count", 18066,
        "Sorry, the number of account id should be at least one and not more than 100.",
        "com.epicgames.account.public", "prod", []
    ))

    var users = await User.find({'id': { $in: req.query.accountId}}).lean()
    
    res.json(users.map(x => {
        return {
            id: x.id,
            displayName: x.displayName,
            externalAuths: {}
        }
    }))
})

app.all("/api/public/account/:accountId/externalAuths", checkToken, (req, res) => res.json({}))

app.all("/api/oauth/verify", checkToken, (req, res, next) => {
    var token = accessTokens.find(x => x.token == req.headers.authorization.split(" ")[1])
    
    if (token) {
        res.json({
            access_token: token.token,
            expires_in: 28800,
            expires_at: new Date().addHours(8),
            token_type: "bearer",
            refresh_token: token.token ,
            refresh_expires: 115200,
            refresh_expires_at: new Date().addHours(32),
            account_id: res.locals.jwt.id,
            client_id: "test",
            internal_client: true,
            client_service: "fortnite",
            scope: [],
            displayName: res.locals.jwt.displayName,
            app: "fortnite",
            in_app_id: res.locals.jwt.accountId
        })
    } else next()
})

app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "com.epicgames.account.public", "prod"
    ))
})
module.exports = app