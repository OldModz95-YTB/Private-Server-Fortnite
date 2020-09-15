const config = require(`${__dirname}/../config.json`);
const https = require('https');
const path = require("path");
const fs = require("fs");

module.exports = {
    keychain() {
        return new Promise((resolve, reject) => {
            https.get(config.keychainUrl, (res) => {
                var shit = ""
                res.on("data", data => shit += data.toString())

                res.on("close", () => {
                    fs.writeFileSync(path.join(__dirname, "../cache/keychain.json"), JSON.stringify(JSON.parse(shit), null, 4));
                    resolve()
                })
            })
        })
    },

    cosmetics() {
        return new Promise((resolve, reject) => {
            https.get(config.cosmeticsUrl, (res) => {
                var shit = ""
                res.on("data", data => shit += data.toString())
                res.on("close", () => {
                    fs.writeFileSync(path.join(__dirname, "../cache/cosmetics.json"), JSON.stringify(JSON.parse(shit), null, 4));
                    resolve()
                })
            })
        })
    },

    getKeychain() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../cache/keychain.json`));
    },

    getCosmetics() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../cache/cosmetics.json`));
    },

    getBanners() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../cache/banners.json`));
    },

    getBannerColors() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../cache/colors.json`));
    },

    getVariants() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../cache/variants.json`));
    }
}

