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

// app.get('/', function (req, res) {

// })

// app.get('/admin', function (req, res) {

// })

app.all('*', function (req, res) {

    console.log(`${req.method} ${req.hostname}${req.originalUrl}`)

    var keyArray = Object.keys(database.paths);

    keyArray.sort()

    pathObject = { ...defaultPath }
    currentPath = '/'

    var pathRewrite = ''

    if (database.pathRewrite[req.hostname]) {
        pathRewrite = database.pathRewrite[req.hostname]
    }

    var formatedOriginalUrl = req.originalUrl.split("?")[0].split("?")[0].substring(0, 1) + pathRewrite + req.originalUrl.split("?")[0].substring(1)

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
            //todo
        } else {
            sendFile = true
        }
    }

    if (sendFile) {
        var filePath = path.join(path.join(__dirname, folder), req.originalUrl.split("?")[0].replace(currentPath, ''))

        var pathIsFolder = false
        if (formatedOriginalUrl.endsWith('/')) {   
            pathIsFolder = true     
            if (fs.existsSync(filePath + "/index.ejs")) {
                var fileStat = fs.statSync(filePath + "/index.ejs")
                if (fileStat && !fileStat.isDirectory()) {
                    filePath = filePath + "/index.ejs"
                    pathIsFolder = false    
                }
            } else 
            if (fs.existsSync(filePath + "/index.html")) {
                var fileStat = fs.statSync(filePath + "/index.html")
                if (fileStat && !fileStat.isDirectory()) {
                    filePath = filePath + "/index.html" 
                    pathIsFolder = false                
                }
            }
        }
        pathObject.headers.forEach(header => {
            res.append(header.key, header.value)
        });

        if (pathIsFolder) {
            if (pathObject.onlineFolder) {
                var childs = fs.readdirSync(filePath, { withFileTypes: true }).sort(function (a, b) {
                    if (a.isDirectory() && !b.isDirectory()) {
                        return -1
                    } else if (!a.isDirectory() && b.isDirectory()) {
                        return 1
                    } else {
                        return 0
                    }
                })
                res.render('onlineFolder.ejs', { req, res, childs })
            } else {
                sendFile = false
            }
        } else {

            var fileStat = null
            if (fs.existsSync(filePath)) {
                fileStat = fs.statSync(filePath)
            }

            if ((!fileStat || fileStat.isDirectory()) && fs.existsSync(filePath + '.ejs')) {
                filePath = filePath + '.ejs'
                if (fs.existsSync(filePath)) {
                    fileStat = fs.statSync(filePath)
                }
            }

            if (fileStat && !fileStat.isDirectory()) {
                if (filePath.endsWith('.ejs')) {
                    res.render(filePath, { req, res })
                } else {
                    res.sendFile(filePath)
                }

            } else {
                sendFile = false
            }
        }



    }
    if (!sendFile) {
        {
            res.render('errors/404.ejs', { req, res })
        }
    }
})

app.listen(config.port);