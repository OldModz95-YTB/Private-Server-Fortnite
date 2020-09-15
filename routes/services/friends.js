const express = require("express")
const app = express.Router()

const Friends = require(`${__dirname}/../../model/Friends`)

//note: use checkToken as middleware anywhere you need to check a token for auth.
const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const errors = require(`${__dirname}/../../structs/errors`)

app.all("/api/v1/:accountId/friends", checkToken, async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ", "friends", "prod"))
 
    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.accepted.map(x => {
        return {
            accountId: x.id,
            groups: [],
            mutual: 0,
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})

app.all("/api/public/friends/:accountId", checkToken, async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ", "friends", "prod"))
 
    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.accepted.map(x => {
        return {
            accountId: x.id,
            groups: [],
            mutual: 0,
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})

app.all("/api/v1/:accountId/outgoing", checkToken, async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ", "friends", "prod"))

    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.outgoing.map(x => {
        return {
            accountId: x.id,
            groups: [],
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})

app.all("/api/v1/:accountId/incoming", checkToken, async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ", "friends", "prod"))

    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.incoming.map(x => {
        return {
            accountId: x.id,
            groups: [],
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})


app.all("/api/v1/:accountId/summary", checkToken, async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ", "friends", "prod"))

    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json({
        friends: friends.accepted.map(x => {
            return {
                accountId: x.id,
                groups: [],
                mutual: 0,
                alias: "",
                note: "",
                favorite: false,
                created: x.createdAt
            }
        }),
        incoming: friends.incoming.map(x => {
            return {
                accountId: x.id,
                favorite: false
            }
        }),
        outgoing: friends.outgoing.map(x => {
            return {
                accountId: x.id,
                favorite: false
            }
        }),
        suggested: [],
        blocklist: [],
        settings: {
            acceptInvites: "public"
        }
    })
})

app.all("/api/v1/:accountId/friends/:friendId", checkToken, async (req, res) => {
    if(req.method != "GET" ? req.method != "POST" ? req.method != "DELETE" : false : false) return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, req.method == "GET" ? "READ" : req.method == "POST" ? "UPDATE" : req.method == "DELETE" ? "DELETE" : "")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, req.method == "GET" ? "READ" : req.method == "POST" ? "UPDATE" : req.method == "DELETE" ? "DELETE" : null, "friends", "prod"))

    var friends = await Friends.findOne({id: req.params.accountId}).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    switch(req.method) {
        case "GET":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.json({
                        accountId: req.params.friendId,
                        groups: [],
                        mutual: 0,
                        alias: "",
                        note: "",
                        favorite: false,
                        created: friends.accepted.find(x => x.id == req.params.friendId).createdAt
                    })
                    break;
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
        case "POST":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} already exists.`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship request has already been sent to ${req.params.friendId}`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({id: req.params.accountId}, {$pull: {incoming: {id: req.params.friendId}}, $push: {accepted: {id: req.params.friendId, createdAt: new Date()}}})
                    await Friends.updateOne({id: req.params.friendId}, {$pull: {outgoing: {id: req.params.accountId}}, $push: {accepted: {id: req.params.accountId, createdAt: new Date()}}})

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type:"FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "ACCEPTED",
                                direction: "OUTBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }

                    if (xmppClients[req.params.accountId]) {
                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type:"FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.friendId,
                                status: "ACCEPTED",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
                default:
                    await Friends.updateOne({id: req.params.accountId}, {$push: {outgoing: {id: req.params.friendId, createdAt: new Date()}}})
                    await Friends.updateOne({id: req.params.friendId}, {$push: {incoming: {id: req.params.accountId, createdAt: new Date()}}})

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.accountId,
                            to: req.params.friendId,
                            status: "PENDING"
                        }))

                        //
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "PENDING",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type:"com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
            }
            break;
        case "DELETE":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({id: req.params.accountId}, {$pull: {accepted: {id: req.params.friendId}}})
                    await Friends.updateOne({id: req.params.friendId}, {$pull: {accepted: {id: req.params.accountId}}})

                    res.status(204).end()
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({id: req.params.accountId}, {$pull: {outgoing: {id: req.params.friendId}}})
                    await Friends.updateOne({id: req.params.friendId}, {$pull: {incoming: {id: req.params.accountId}}})    

                    res.status(204).end()
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({id: req.params.accountId}, {$pull: {incoming: {id: req.params.friendId}}})
                    await Friends.updateOne({id: req.params.friendId}, {$pull: {outgoing: {id: req.params.accountId}}})    

                    res.status(204).end()
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
    }

    //9b5044aff07f4e52af151da6d1fb5bfa
    //71a0b60611cb45d1ac191e03ceebc8c7
})

app.all("/api/v1/:accountId/blocklist", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`blocklist:${req.params.accountId}`, "READ", "friends", "prod"))

    res.json([])
})

app.all("/api/v1/:accountId/settings", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    if(!res.locals.jwt.checkPermission(`friends:${req.params.accountId}`, "READ")) 
        return res.status(403).json(errors.permission(`friends:${req.params.accountId}`, "READ"))

    res.json({
        acceptInvites: "public"
    })
})

app.all("/api/v1/:accountId/recent/Fortnite", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    res.json([])
})

app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "friends", "prod"
    ))
})

module.exports = app