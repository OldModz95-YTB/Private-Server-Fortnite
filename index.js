const bodyparser = require("body-parser")
const mongoose = require("mongoose")
const express = require("express")
const fs = require("fs")
const app = express()

const logging = require(`${__dirname}/structs/logs`)
const config = require(`${__dirname}/config.json`)


//i know global isn't the best practice, but it works good enough
global.exchangeCodes = {}
global.clientTokens = []
global.accessTokens = []
global.xmppClients = {}
global.parties = []
global.invites = []
global.pings = []

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))

require("./xmpp")

//db
mongoose.connect(config.db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true}, async e => {
    if (e) throw e
    logging.fdev(`Connected to Mongo DB`)
})

app.use(require(`${__dirname}/routes`))

//gets the services working n shit
app.use("/waitingroom", require(`${__dirname}/routes/services/waitingroom`))
app.use("/lightswitch", require(`${__dirname}/routes/services/lightswitch`))
app.use("/datarouter", require(`${__dirname}/routes/services/datarouter`))
app.use("/fortnite", require(`${__dirname}/routes/services/fortnite`))
app.use("/presence", require(`${__dirname}/routes/services/presence`))
app.use("/content", require(`${__dirname}/routes/services/content`))
app.use("/account", require(`${__dirname}/routes/services/account`))
app.use("/friends", require(`${__dirname}/routes/services/friends`))
app.use("/party", require(`${__dirname}/routes/services/party`))

global.launcherversion = fs.readFileSync(`${__dirname}/public/files/version`).toString()
global.serverversion = "1.5"

//hopefully this should fix the memory leak issue
setInterval(() => {
    parties.forEach(party => {
        // check if the member still exists in xmpp, if not delete them and then do the check
        party.members.forEach(member => {
            if (!xmppClients[member.account_id]) {
                let index = party.members.indexOf(member);
                if (index !== 1) {
                    party.members.splice(index, 1);
                }
            }
        });

        if (party.members.length <= 0) {
            let index = parties.indexOf(party);
            if (index !== -1) {
                parties.splice(index, 1);
            }
        }
    });
}, 30000);

app.listen(process.env.port || config.port || 80, () => {
    logging.fdev(`Created by Slushia and Cyuubi, Version \x1b[36m${serverversion}`)
    logging.fdev(`Listening on port \x1b[36m${process.env.port || config.port || 80}`)
    logging.fdev(`XMPP listening on port \x1b[36m${process.env.xmppPort || config.xmppPort || 443}`)
    logging.fdev(`======================================================`)
    logging.fdev(`Edite By OldModz95 | YouTube: OldModz95 | Discord: discord.gg/3t2568W`)
})
