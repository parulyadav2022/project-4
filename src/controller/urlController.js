const UrlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require("redis");



const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13313,
  "redis-13313.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("WVKxWfZaIOYhHXKzhWVRe6vdPKQbaH7n", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

/*const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const createAuthor = async function (req, res) {
  let data = req.body;
  let authorCreated = await authorModel.create(data);
  res.send({ data: authorCreated });
};

const fetchAuthorProfile = async function (req, res) {
  let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
  if(cahcedProfileData) {
    res.send(cahcedProfileData)
  } else {
    let profile = await authorModel.findById(req.params.authorId);
    await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
    res.send({ data: profile });
  }

};

module.exports.createAuthor = createAuthor;
module.exports.fetchAuthorProfile = fetchAuthorProfile;*/

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const getUrl = async (req,res) => {
    try
    {
        let urlCode = req.params.urlCode
        //caching
        let cachedLongUrl = await GET_ASYNC(`${urlCode}`)

        //if key name urlCode is present in cache memory
        if(cachedLongUrl){
            return res.status(300).redirect(cachedLongUrl)
        }
        
        //key urlcode is not present in cache memory
        const url = await UrlModel.findOne({urlCode:urlCode})
        
        if(!url){
            return res.status(404).send({status:false , message: " no URL found"})
        }
        
        //using set to assign new key value pair in cache
        await SET_ASYNC(`${urlCode}`,JSON.stringify(url.longUrl))


        return res.status(300).redirect({status:true , data:url.longUrl})
    }
    
    catch(err){
        return res.status(500).send({status:false ,message: err.message})
    }
}








const urlShortner = async (req, res) => {
    try {
        let longUrl = req.body.longUrl
        if (!longUrl || !longUrl.trim()) return res.status(400).send({ status: false, message: "longUrl is required" });

        const url_valid = function (url) {
            let regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i
            return regex.test(url)
        }

        if (!url_valid(longUrl)) return res.status(400).send({ status: false, message: "Invalid longUrl  link" });

        const isUrlPresent = await UrlModel.findOne({ longUrl })

        //if url is already present
        if (isUrlPresent) {
            return res.status(200).send({ status: true, data: isUrlPresent })
        }


        //base url
        const baseUrl = 'http://localhost:3000'

        //url code generation
        const urlCode = shortid.generate()
        console.log(urlCode)

        const shortUrl = baseUrl + '/' + urlCode
        console.log(shortUrl)

        const url = await UrlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode })
        return res.status(201).send({ status: true, message: "successs", data: url })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



  
module.exports = { urlShortner, getUrl }




