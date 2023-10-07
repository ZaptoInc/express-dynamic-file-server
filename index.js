const express = require('express')
const fs = require('fs')
const path = require('path');

const config = require('./config.json')
const Default = require('./default.js')
const defaultPath = { ...Default.Path }

const app = express()

var database = {}

if (fs.existsSync('./database.json')) {
    database = require('./database.json')
}

if (!database.paths) {

    database.paths = {
        '/': { ...defaultPath }
    }
}

if (!database.pathRewrite) {

    database.pathRewrite = {
    }
}

fs.writeFileSync('./database.json', JSON.stringify(database))

app.get('*', function (req, res) {

    var keyArray = Object.keys(database.paths);

    keyArray.sort()

    pathObject = { ...defaultPath }
    currentPath = '/'

    var pathRewrite = ''

    if (database.pathRewrite[req.hostname]) {
        pathRewrite = database.pathRewrite[req.hostname]
    }

    var formatedOriginalUrl = req.originalUrl.substring(0, 1) + pathRewrite + req.originalUrl.substring(1)

    keyArray.forEach(function (item) {
        if (formatedOriginalUrl.startsWith(item)) {
            currentPath = item
            pathObject = database.paths[item]
        }
    })

    var allowedHostname = false

    if (pathObject.allowedHostname.length > 0) {
        pathObject.allowedHostname.forEach(hostname => {
            if (hostname == '*' || req.hostname == hostname) {
                allowedHostname = true
            }
        });
    } else {
        allowedHostname = true
    }

    var sendFile = false
    if (allowedHostname) {


        var folder = config.defaultFolder
        if (pathObject.folder) {
            folder = pathObject.folder
        }
        if (pathObject.protection) {

        } else {
            sendFile = true
        }
    }

    if (sendFile) {
        var filePath = path.join(path.join(__dirname, folder), req.originalUrl.replace(currentPath, ''))
        console.log(filePath)
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath)
        } else {
            sendFile = false
        }
        pathObject.headers.forEach(header => {
            res.append(header.key, header.value)
        });
    }
    if (!sendFile) {
        {
            res.status(404)
            res.send('404 not found')
        }
    }
})

app.listen(config.port);