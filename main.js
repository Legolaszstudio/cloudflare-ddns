const requiem = require("requiem-http");
const colors = require('colors');
const fs = require('fs');
let updateCounter = 0;
let failureCounter = 0;

async function main() {
    console.log(`Welcome! It's ${new Date().toString()}`.cyan);
    let config = readConfig();
    console.log("Read configuration file".magenta);
    let ipAdresses = await getCurrentIPs();
    for (const key of config.domains) {
        let curConfig = {
            cloudflareApiKey: config.cloudflareApiKey,
            cloudflareEmail: config.cloudflareEmail,
            zone: key.zone,
            domains: key.domains,
        };
        await updateCloudflareEntries(curConfig, ipAdresses);
        console.log("\n");
    }
    console.log("\n");
    console.log(`Bye! We successfully updated ${updateCounter} dns records! (${failureCounter} fails)`.cyan);
    console.log("\n");
    console.log("---------------------------------".cyan);
    console.log("\n");
}

function readConfig() {
    //Read config.json
    var rawData = fs.readFileSync("config.json", "utf-8");
    return JSON.parse(rawData);
}

async function getCurrentIPs() {
    //Get ipv4 address
    let ipv4 = await requiem.requestJson("https://api.ipify.org/?format=json");
    let ipv6 = null;
    console.log(`Got ipv4 address (${ipv4.body.ip})`.magenta);
    try {
        //Get ipv6 address
        ipv6 = await requiem.requestJson("https://api6.ipify.org/?format=json");
        ipv6 = ipv6.body.ip;
        console.log(`Got ipv6 address (${ipv6})`.magenta);
    } catch (e) {
        //Not everyone has ipv6
        ipv6 = null;
        console.warn("Seems like you have got no ipv6 address".yellow);
        console.log(e);
    }
    return {
        ipv4: ipv4.body.ip,
        ipv6: ipv6,
    };
}

async function updateCloudflareEntries(config, ipAdresses) {
    //Get the zones the user owns
    let ownedZones = await requiem.requestJson({
        url: "https://api.cloudflare.com/client/v4/zones",
        headers: {
            "X-Auth-Key": config.cloudflareApiKey,
            "X-Auth-Email": config.cloudflareEmail,
            "Content-Type": "application/json",
        },
    });
    ownedZones = ownedZones.body;
    let zoneId = ownedZones.result.filter(function(element) {
        //Filter for zone we want to edit
        return element.name == config.zone;
    });
    if (zoneId.length == 0) {
        console.error(`Zone with name ${config.zone} not found`);
        return;
    }
    zoneId = zoneId[0].id;
    console.log(`Got ${config.zone}'s id`.magenta);
    //Get all of the dns records the zone has
    let allDnsRecords = await requiem.requestJson({
        url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        headers: {
            "X-Auth-Key": config.cloudflareApiKey,
            "X-Auth-Email": config.cloudflareEmail,
            "Content-Type": "application/json",
        },
    });
    console.log(`Got all (${allDnsRecords.body.result.length}) dns records`.magenta);
    let domainsToEdit = [];
    //Go through all the domains specified in config.json
    for (let element of config.domains) {
        let tempItems = allDnsRecords.body.result.filter(function(filterElement) {
            return filterElement.name == element;
        });
        if (tempItems.length == 0) {
            console.warn(`No dns record found for ${element}`.red);
        } else {
            domainsToEdit = domainsToEdit.concat(tempItems);
        }
    }
    console.log(`Grabbed domains to edit (${domainsToEdit.length})`.magenta);
    //Check for changes
    for (let element of domainsToEdit) {
        if (element.type == "A") {
            if (element.content == ipAdresses.ipv4) {
                console.log(`Domain ${element.name} ipv4 has not changed since last check`.magenta);
            } else {
                await changeDomainRecord({
                    config: config,
                    zoneId: zoneId,
                    name: element.name,
                    domainId: element.id,
                    oldAddress: element.content,
                    newAddress: ipAdresses.ipv4,
                });
            }
        } else if (element.type == "AAAA") {
            if (element.content == ipAdresses.ipv6) {
                console.log(`Domain ${element.name} ipv6 has not changed since last check`.magenta);
            } else {
                if (ipAdresses.ipv6 == null) {
                    console.error(`Can't update ${element.name}'s AAAA record because this host doesn't have access to a ipv6 network connection`.red);
                    failureCounter++;
                } else {
                    await changeDomainRecord({
                        config: config,
                        zoneId: zoneId,
                        name: element.name,
                        domainId: element.id,
                        oldAddress: element.content,
                        newAddress: ipAdresses.ipv6,
                    });
                }
            }
        } else {
            console.warn(`Not supported record type ${element.type} for domain ${element.name}   Skipping!`.yellow);
        }
    }
}

async function changeDomainRecord(inputData) {
    let postJsonOptions = {
        url: `https://api.cloudflare.com/client/v4/zones/${inputData.zoneId}/dns_records/${inputData.domainId}`,
        headers: {
            "X-Auth-Key": inputData.config.cloudflareApiKey,
            "X-Auth-Email": inputData.config.cloudflareEmail,
            "Content-Type": "application/json",
        },
        method: "PATCH",
        body: `{"content":"${inputData.newAddress}"}`,
    };
    let result = await requiem.requestJson(postJsonOptions);
    if (result.statusCode == 200) {
        console.log(`successfully changed ${inputData.name} from ${inputData.oldAddress} to ${inputData.newAddress}`.green);
        updateCounter++;
    } else {
        console.error(`An error occured while trying to update ${inputData.name}, dumping response:`.red);
        console.log(JSON.stringify(result.body, null, 4));
        failureCounter++;
    }
}

main();