module.exports = {
    Path : {
        protection:false, // true / false
        protectionType:"PASSWORD", //NONE, PASSWORD 
        password:"", //password as bcrypt
        headers : [], //list of headers added to the result
        allowedHostname : [], //list of hostnames allowed to use this path
        folder : null, //folder to use, or null to use the default one (with relative path)
        onlineFolder : false //acts as an online folder with navigation and folder/file listing
    }
}