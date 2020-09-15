const express = require("express")
const crypto = require("crypto")
const app = express.Router()


const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const errors = require(`${__dirname}/../../structs/errors`)
const Friends = require(`${__dirname}/../../model/Friends`)
const User = require(`${__dirname}/../../model/User`)
const Party = require(`${__dirname}/../../party`)

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

app.all("/api/v1/Fortnite/user/:accountId", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("party", "prod"))
    res.json({
        current: parties.filter(x => x.id == req.params.accountId),
        invites: invites.filter(x => x.id == req.params.accountId),
        pending: [],
        pings: pings.filter(x => x.id == req.params.accountId),
    })
})

//create party
app.all("/api/v1/Fortnite/parties", checkToken, (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var yeah = req.body.config && req.body.join_info && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.", 
        "party", "prod", [
            req.body.config ? null : "config",
            req.body.meta ? null : "meta",
            req.body.join_info ? null : "join_info"
        ].filter(x => x != null)
    ))

    
    if (!xmppClients[res.locals.jwt.accountId]) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.user_is_offline", 51024,
        `Operation is forbidden because the user ${res.locals.jwt.accountId} is offline.`,
        "party", "prod", [res.locals.jwt.accountId]
    ))

    if (xmppClients[res.locals.jwt.accountId].client.jid != req.body.join_info.connection.id) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.user_is_offline", 51024,
        `Operation is forbidden because the user ${res.locals.jwt.accountId} is offline.`,
        "party", "prod", [res.locals.jwt.accountId]
    ))

    if (parties.find(x => x.members.includes(res.locals.jwt.accountId))) return res.status(409).json(errors.create(
        "errors.com.epicgames.social.party.user_has_party", 51012,
        `User [${res.locals.jwt.accountId}] already has party in namespace [Fortnite] with subtype [default]`,
        "party", "prod", [res.locals.jwt.accountId, "Fortnite", "default"]
    ))


    var party = new Party(req.body.config, req.body.join_info, req.body.meta)
    
    res.json(party.getPartyInfo())
})

//update party!
app.all("/api/v1/Fortnite/parties/:partyId", checkToken,  (req, res) => {
    if(req.method != "PATCH" ? req.method != "GET" ?  req.method != "DELETE" ? true : false : false : false) return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    switch (req.method) {
        case "PATCH": 
            if (party.party.members.find(x => x.role == "CAPTAIN").account_id != res.locals.jwt.accountId) return res.status(403).json(errors.create(
                "errors.com.epicgames.social.party.party_change_forbidden", 51015,
                `The user ${res.locals.jwt.accountId} has no right to make changes to party ${req.params.partyId}`,
                "party", "prod", [res.locals.jwt.accountId, req.params.partyId]
            ))
        
        party.party.updatePartyMeta(req.body.meta.update, req.body.meta.delete)
        res.status(204).send()
            break;
        case "GET":
            return res.json(party.party.getPartyInfo())
            break;
        case "DELETE":
            party.party.deleteParty()
            return res.status(204).end()
            break;
    }
})

//update party member meta
app.all("/api/v1/Fortnite/parties/:partyId/members/:accountId/meta", checkToken, (req, res) => {
    if(req.method != "PATCH") return res.status(405).json(errors.method("party", "prod"))
    var party = parties.find(x => x.id == req.params.partyId)


    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    if (!party.members.includes(req.params.accountId)) return res.status(404).end()
    
    /*
    if (party.party.members.find(x => x.role == "CAPTAIN").account_id != res.locals.jwt.accountId) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.member_state_change_forbidden", 51014,
        `The user ${res.locals.jwt.accountId} has no permission to change member state of ${req.params.accountId}`,
        "party", "prod", [res.locals.jwt.accountId, req.params.accountId]
    ))
*/
    party.party.updateUserMeta(req.params.accountId, req.body.update, req.body.delete)
    res.status(204).send()
})


//join party
app.all("/api/v1/Fortnite/parties/:partyId/members/:accountId/join", checkToken, (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("party", "prod"))
    var party = parties.find(x => x.id == req.params.partyId)


    var yeah = req.body.connection && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.", 
        "party", "prod", [
            req.body.connection ? null : "connection",
            req.body.meta ? null : "meta",
        ].filter(x => x != null)
    ))

    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    /*
    if (party.party.config != "OPEN") return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.party_join_forbidden", 51006,
        `The user ${req.params.accountId} has no right to join party ${req.params.partyId}.`,
        "party", "prod", [req.params.accountId, req.params.partyId]
    ))
*/
    party.party.addMember(req.body.connection, req.body.meta)
    
    res.json({
        status : "JOINED",
        party_id : req.params.partyId
    })
})

//delete member
app.all("/api/v1/Fortnite/parties/:partyId/members/:accountId", checkToken,  (req, res) => {
    if(req.method != "DELETE") return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    party.party.removeMember(req.params.accountId)
    res.status(204).end()
})

app.all("/api/v1/Fortnite/user/:accountId/pings/", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("party", "prod"))

    if (req.params.accountId != res.locals.jwt.accountId) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.user_operation_forbidden", 51023,
        `The target accountId ${req.params.accountId} doesn't match the authenticated user ${res.locals.jwt.accountId}.`,
        "party", "prod", [req.params.accountId, res.locals.jwt.accountId]
    ))


    res.json(pings.filter(x => x.sent_to == req.params.accountId))
})

app.all("/api/v1/Fortnite/user/:accountId/pings/:pingerId/parties", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("party", "prod"))

    if (req.params.accountId != res.locals.jwt.accountId) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.user_operation_forbidden", 51023,
        `The target accountId ${req.params.accountId} doesn't match the authenticated user ${res.locals.jwt.accountId}.`,
        "party", "prod", [req.params.accountId, res.locals.jwt.accountId]
    ))

    var query = pings.filter(x => x.sent_to == req.params.accountId).filter(x => x.sent_by == req.params.pingerId)
    if (query.length == 0) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.ping_not_found", 51021,
        `Sorry, we couldn't find a ping for user ${req.params.accountId} from ${req.params.pingerId}.`,
        "party", "prod", [req.params.accountId, req.params.pingerId]
    ))

    res.json(query.map(y => {
        var party = parties.find(x => x.members.includes(y.sent_by))
        if (!party) return null; else party = party.party
        return {
            id: party.id,
            created_at: party.createdAt,
            updated_at: party.updatedAt,
            config: party.config,
            members: party.members,
            applicants: [],
            meta: party.meta,
            invites: [],
            revision: party.revision || 0
        }
    }).filter(x => x != null))
})

app.all("/api/v1/Fortnite/user/:accountId/pings/:pingerId", checkToken, (req, res) => {
    if(req.method != "POST" ? req.method != "DELETE" ? true : false : false) return res.status(405).json(errors.method("party", "prod"))


    switch (req.method) {
        case "POST":

            if (pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)) 
                pings.splice(pings.findIndex(x => x == pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)), 1)

            pings.push({
                sent_by: req.params.pingerId,
                sent_to: req.params.accountId,
                sent_at: new Date(),
                expires_at: new Date().addHours(1),
                meta: {}
            })

            var ping = pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)
            
            if (xmppClients[req.params.accountId]) {
                xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                    expires: ping.expires_at,
                    meta: {},
                    ns: "Fortnite",
                    pinger_dn: res.locals.jwt.displayName,
                    pinger_id: req.params.pingerId,
                    sent: ping.sent_at,
                    type: "com.epicgames.social.party.notification.v0.PING"
                }))
            }

            res.json(ping)
            break;
        case "DELETE":
            if (pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)) 
                pings.splice(pings.findIndex(x => x == pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)), 1)
            res.status(204).end()
            break;
    }
})

app.all("/api/v1/Fortnite/user/:accountId/pings/:pingerId/join", checkToken, (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var yeah = req.body.connection && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.", 
        "party", "prod", [
            req.body.connection ? null : "connection",
            req.body.meta ? null : "meta",
        ].filter(x => x != null)
    ))

    if (req.params.accountId != res.locals.jwt.accountId) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.user_operation_forbidden", 51023,
        `The target accountId ${req.params.accountId} doesn't match the authenticated user ${res.locals.jwt.accountId}.`,
        "party", "prod", [req.params.accountId, res.locals.jwt.accountId]
    ))

    var query = pings.filter(x => x.sent_to == req.params.accountId).filter(x => x.sent_by == req.params.pingerId)
    if (query.length == 0) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.ping_not_found", 51021,
        `Sorry, we couldn't find a ping for user ${rqe.params.accountId} from ${req.params.pingerId}.`,
        "party", "prod", [req.params.accountId, req.params.pingerId]
    ))

    var party = parties.find(x => x.members.includes(query[0].sent_by))

    party.party.addMember(req.body.connection, req.body.meta)

    res.json({
        status: "JOINED",
        party_id: party.id
    })

})

app.all("/api/v1/Fortnite/parties/:partyId/members/:accountId/promote", checkToken, async (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    if (!res.locals.jwt.accountId == party.party.getPartyLeader()) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.member_state_change_forbidden", 51014,
        `The user ${res.locals.jwt.accountId} has no permission to change member state of ${req.params.accountId}`,
        "party", "prod", [res.locals.jwt.accountId, req.params.accountId]
    ))

    party.party.setPartyLeader(req.params.accountId)
    res.status(204).end()

})
app.use((req, res, next) => {
    res.status(404).json(errors.create(
        "errors.com.epicgames.common.not_found", 1004,
        "Sorry the resource you were trying to find could not be found",
        "party", "prod"
    ))
})

module.exports = app