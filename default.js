module.exports = {
    Path : {
        protection:false, // true / false
        protectionType:"PASSWORD", //NONE, PASSWORD 
        password:"", //password as bcrypt
        headers : [], //list of headers added to the result
        allowedHostname : [], //list of hostnames allowed to use this path
        folder : null, //folder to use, or null to use the default one (with relative path)
        onlineFolder : false, //acts as an online folder with navigation and folder/file listing,
        pathRewrite : {}, //rewrites the urls to another path
        disallowedFiles : [], //disallowed files to not be served
        errorPages : {} //error pages path (if 'folder' is set, it uses 'folder' as base path for the file)
    }
}