const express = require('express'); //import express.js
const fs = require('fs'); //inport fs
const path = require('path'); //import path
const path_ = path; //declare path_ as path (if path is used as a variable)
const fileUpload = require('express-fileupload'); //import express-fileupload
var bodyParser = require('body-parser'); //import body-parser

const config = require('./config.json'); //import the config file
const Default = require('./default.js'); // import the default values
const defaultPath = { ...Default.Path, folder: config.defaultFolder }; //declare defaultPath with config.defaultFolder as folder

const app = express(); //initiate an express app

app.use(fileUpload()); //use the fileupload middleware
app.use(bodyParser.urlencoded({ extended: false })); //parse url encoded body
app.use(bodyParser.json()); //parse json body

//manage all requests for any methods
app.all('*', function (req, res) {
    try {

        console.log(`${req.method} ${req.hostname}${req.originalUrl}`); //log the request

        currentPath = decodeURI(req.originalUrl.split("?")[0]); //remove the query params from the url

        var folderConfig = getFolderConfig(currentPath, config.defaultFolder, req.hostname, currentPath); //get the folder config for this request

        try {
            var allowedHostname = false;
            //if the folderConfig allowedHostname is not empty and if the hostname is in allowedHostname
            if (doesMatchFromList(folderConfig.config.allowedHostname, req.hostname)) {
                allowedHostname = true;
            } else if (folderConfig.config.allowedHostname.length > 0) {
                allowedHostname = true;
            }

            var sendFile = false; //can the file (or folder) be sent
            if (allowedHostname) {

                var folder = config.defaultFolder; //sets base the folder as the defaultFolder
                if (folderConfig.config.folder) {
                    folder = folderConfig.config.folder; //sets the base folder as the folderConfig folder value
                }
                if (folderConfig.config.protection) {
                    //todo
                } else {
                    sendFile = true; //does not have protection, so it can be sent
                }
            }

            if (sendFile) {
                var filePath = path.join(path.join(__dirname, folder), folderConfig.path); //sets the path of the file

                var pathIsFolder = false;
                // check if the url ends with '/'
                if (folderConfig.URL.endsWith('/')) {
                    pathIsFolder = true;
                    // if the file 'index.ejs' exists in the folder, add it to the path
                    if (fs.existsSync(filePath + "/index.ejs")) {
                        var fileStat = fs.statSync(filePath + "/index.ejs");
                        if (fileStat && !fileStat.isDirectory()) {
                            filePath = filePath + "/index.ejs";
                            pathIsFolder = false;
                        }
                    } else
                        // if the file 'index.html' exists in the folder, add it to the path
                        if (fs.existsSync(filePath + "/index.html")) {
                            var fileStat = fs.statSync(filePath + "/index.html");
                            if (fileStat && !fileStat.isDirectory()) {
                                filePath = filePath + "/index.html";
                                pathIsFolder = false;
                            }
                        }
                    // if the filePath exists, it's not a folder
                    if (!fs.existsSync(filePath)) {
                        pathIsFolder = false;
                    }
                }
                //add the headers to the response
                folderConfig.config.headers.forEach(header => {
                    res.append(header.key, header.value)
                });
                // if it's a folder
                if (pathIsFolder) {
                    // if online folder is enabled
                    if (folderConfig.config.onlineFolder) {
                        // order the childs of the folder by folder, files
                        var childs = fs.readdirSync(filePath, { withFileTypes: true }).sort(function (a, b) {
                            if (a.isDirectory() && !b.isDirectory()) {
                                return -1;
                            } else if (!a.isDirectory() && b.isDirectory()) {
                                return 1;
                            } else {
                                return 0;
                            }
                        })

                        var formatedChilds = [];
                        //reformat the childs, without the .fsconfig files disallowedFiles
                        childs.forEach(child => {
                            if (!child.name.endsWith(".fsconfig") && !doesMatchFromList(folderConfig.config.disallowedFiles, child.name)) {
                                var fullChildPath = path.join(filePath, child.name);
                                if (child.isDirectory()) {
                                    child.size = getFolderSize(fullChildPath);
                                } else {
                                    var childStat = fs.statSync(fullChildPath);
                                    child.size = childStat.size;
                                }
                                child.sizeText = getBytesText(child.size);
                                formatedChilds.push(child);
                            }
                        });
                        //sets the default online folder renderer
                        var onlineFolderRenderer = 'onlineFolder.ejs';
                        //if onlineFolder has a value and not true
                        if (folderConfig.config.onlineFolder &&
                            !(folderConfig.config.onlineFolder == true)) {
                            //set the path of the potentialOnlineFolderRenderer
                            var potentialOnlineFolderRenderer = path.join(path.join(__dirname, folderConfig.config.folder), folderConfig.config.onlineFolder);
                            // if it exists and is not a directory set onlineFolderRenderer to potentialOnlineFolderRenderer
                            if (fs.existsSync(potentialOnlineFolderRenderer) &&
                                !fs.statSync(potentialOnlineFolderRenderer).isDirectory()) {
                                onlineFolderRenderer = potentialOnlineFolderRenderer;
                            }
                        }
                        //render the onlineFolderRenderer
                        res.render(onlineFolderRenderer, { req, res, childs: formatedChilds, fs, config: folderConfig, __dirname });
                    } else {
                        sendFile = false;
                    }
                } else {
                    //sets the fileStat value if the filePath exists
                    var fileStat = null;
                    if (fs.existsSync(filePath)) {
                        fileStat = fs.statSync(filePath);
                    }
                    // if fileStat doesn't exists or is a directory, check if the filePath exists as a ejs file, if so, set fileStat as the ejs file
                    if ((!fileStat || fileStat.isDirectory()) && fs.existsSync(filePath + '.ejs')) {
                        filePath = filePath + '.ejs';
                        if (fs.existsSync(filePath)) {
                            fileStat = fs.statSync(filePath);
                        }
                    }
                    //check fileStat exists and is not a directory else do not send it
                    if (fileStat && !fileStat.isDirectory()) {
                        //if the file is disallowed, do not send it
                        if (doesMatchFromList(folderConfig.config.disallowedFiles, filePath)) {
                            sendFile = false;
                        } else
                            //if the file is a .fsconfig, do not send it
                            if (filePath.endsWith('.fsconfig')) {
                                sendFile = false;
                            } else
                                // if the file is a ejs, render it, else send it as is
                                if (filePath.endsWith('.ejs')) {
                                    res.render(filePath, { req, res, fs, config: folderConfig, __dirname });
                                } else {
                                    res.sendFile(filePath);
                                }

                    } else {
                        sendFile = false;
                    }
                }



            }
            //checks if the file is sent, else return the 404 error
            if (!sendFile) {
                executeError(404, 'errors/404.ejs', folderConfig, req, res);
            }
        } catch (error) {
            executeError(500, 'errors/500.ejs', folderConfig, req, res, error);
        }
    } catch (error) {
        executeError(500, 'errors/500.ejs', { config: defaultPath, URL: decodeURI(req.originalUrl.split("?")[0]) }, req, res, error);
    }
});

//returns the byte size of a folder
const getFolderSize = function (folder) {
    var result = 0;
    fs.readdirSync(folder, { withFileTypes: true }).forEach(element => {
        if (element.isDirectory()) {
            result = getFolderSize(path.join(folder, element.name));
        } else {
            result = result + fs.statSync(path.join(folder, element.name)).size;
        }
    });
    return result;
}

//returns the compressed text of the number of bytes
const getBytesText = function (bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

    if (bytes == 0) {
        return "n/a";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    if (i == 0) {
        return bytes + " " + sizes[i];
    }

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

//returns the folder config
const getFolderConfig = function (path, workingPath, domain = '127.0.0.1', URL = '/', currentConfig = { ...defaultPath }, relativePath = null) {
    //if relativePath is not set, set it as path
    if (!relativePath) {
        relativePath = path;
    }
    //sets the default result as the currentConfig
    var result = currentConfig;
    //replace the '\' by '/'
    var workingPath = workingPath.replace('\\', '/');
    path = path.replace('\\', '/');

    //sets the default left path as path
    var leftPath = path;
    //sets the default file path as path
    var filePath = path;

    // if path ends by '/', remove the '/'
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    } else {
    }

    // split the path by '/'
    path.split('/').forEach(pathPart => {
        //remove the path part in leftPath 
        leftPath = leftPath.replace(pathPart + '/', '');
        //tries to get the fs config of the path
        var currentFsConfig = getFsConfig(path_.join(__dirname, workingPath, pathPart) + '.fsconfig');
        //if the fs config does not exists and the workingPath does not ends by '/'
        if (!currentFsConfig
            && !workingPath.endsWith('/')) {
            //add '/' at the end of the workingPath 
            workingPath = workingPath + '/';
            //retries to get the fs config of the path
            currentFsConfig = getFsConfig(path_.join(__dirname, workingPath, pathPart) + '.fsconfig');
        }
        //if the fs config still does not exists, try to get the fs config the child folder
        if (!currentFsConfig) {
            currentFsConfig = getFsConfig(path_.join(__dirname, workingPath, pathPart) + '\\.fsconfig');
        }
        // if the fs config exists
        if (currentFsConfig) {
            //aggregate the fs config in the result
            result = { ...result, ...currentFsConfig };
            // if fs config has a pathRewrite parameter and pathRewrite contains the domain
            if (currentFsConfig.pathRewrite
                && currentFsConfig.pathRewrite[domain]) {
                //add the pathRewrite before the leftPath
                leftPath = currentFsConfig.pathRewrite[domain] + leftPath;
                //add the pathRewrite in the URL
                URL = URL.substring(0, 1) + currentFsConfig.pathRewrite[domain] + URL.substring(1);
                //set the relativePath as the path without the '/' at the end and the leftPath
                relativePath = path.substring(0, 1) + leftPath;
                //set the filePath as the leftPath
                filePath = leftPath;
            }
            //if the fs config as a folder parameter and the folder is not the workingPath
            if (currentFsConfig.folder
                && currentFsConfig.folder !== workingPath) {
                    //set the workingPath as the folder
                workingPath = currentFsConfig.folder;
                //set the relativePath as the leftPath
                relativePath = leftPath;
                //set the filePath as the leftPath
                filePath = leftPath;
            }
            //if the fs config has a pathRewrite parameter or has the folder parameter
            if ((currentFsConfig.pathRewrite
                && currentFsConfig.pathRewrite[domain])
                || (currentFsConfig.folder
                    && currentFsConfig.folder !== workingPath)) {
                //get the config of the folder after rerouting the request
                var newConfig = getFolderConfig(leftPath, workingPath, domain, URL, result, relativePath);
                //set the result as the config the rerouted request
                result = {...result, ...newConfig.config};
                //set the URL as the URL the rerouted request
                URL = newConfig.URL;
                //set the filePath as the path the rerouted request
                filePath = newConfig.path;
            }
        } else {
        }
    });
    return { config: result, URL, path: filePath };
}
//return the fs config of a path or null
const getFsConfig = function (path) {
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path));
    } else {
        return null;
    }
}

//return if the string has the value, with wildcard support
//from https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
const matchRuleShort = function (str, rule) { 
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

//returns true if there's a match in the list
const doesMatchFromList = function (list, str) {
    result = false
    list.forEach(rule => {
        if (matchRuleShort(str, rule)) {
            result = true
            return result
        }
    });
    return result
}

//error renderer
const executeError = function (code, defaultFile, folderConfig, req, res, data = null) {
    var errorFile = defaultFile
    if (folderConfig.config.errorPages
        && folderConfig.config.errorPages[code]) {
        const errorFilePath = path.join(path.join(__dirname, folderConfig.config.folder), folderConfig.config.errorPages[code])
        if (fs.existsSync(errorFilePath)
            && !fs.statSync(errorFilePath).isDirectory()) {
            errorFile = errorFilePath;
        }

    }
    res.status(code)
    res.render(errorFile, { req, res, fs, config: folderConfig, __dirname, data })
}

//make the express app listen on the config port
app.listen(config.port);