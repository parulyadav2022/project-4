const UrlModel = require("../models/urlModel")
const validurl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')


const { promisify } = require("util");

// const url_valid = function(url){
//     let regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
//     console.log(regex.test(url.trim()))
//     return regex.test(url.trim())
// }

//URL VALIDATION BY REGEX
const validateurl = (url) => {
  return String(url.trim()).match(
    //(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    //^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
    /^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s])?/gm
  )
};


//Connect to redis
const redisClient = redis.createClient(
  10294,
  "redis-10294.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("fot70eqx5C1SPuCDwTXWPaZEcKegIkfp", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);




const urlShortner = async (req, res) => {
  try {
    let longUrl = req.body.longUrl

    if (Object.keys(req.body).length == 0 || !longUrl.trim()) {
      return res.status(400).send({ status: false, message: "please enter a URL" })
    }

    //url validation
    // let isValidUrl = "((http|https)://)(www.)?[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)"

    if (!validateurl(longUrl)) {
      return res.status(400).send({ status: false, message: "please enter a valid URL" })
    }

    //check in cache memory
    const cachedUrl = await GET_ASYNC(`${longUrl}`)
    if (cachedUrl) {
      return res.status(200).send({ status: true, message:"data from cache",data: JSON.parse(cachedUrl) })
    }


    //find longUrl is present in our db
    const isUrlPresent = await UrlModel.findOne({ longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0 })

    //if url is already present
    if (isUrlPresent) {
      await SET_ASYNC(`${longUrl}`, JSON.stringify(isUrlPresent))
      return res.status(200).send({ status: true,message:"url already shortened", data: isUrlPresent })
    }

    //base url
    const baseUrl = 'http://localhost:3000'
    if (!validurl.isUri(baseUrl)) {
      return res.status(400).send({ message: "invalid baseurl" })
    }

    //url code generation
    const urlCode = shortid.generate().toLowerCase()
    console.log(urlCode)

    //shortUrl
    const shortUrl = baseUrl + '/' + urlCode
    console.log(shortUrl)

    //creating entry in database
    const url = await UrlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode })

    //setting data in cache
    await SET_ASYNC(`${longUrl}`, JSON.stringify({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode }))

    return res.status(201).send({ status: true, data: url })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

const getUrl = async (req, res) => {
  try {
    let urlCode = req.params.urlCode
    if(!urlCode.trim()){
      return res.status(400).send({ status: false, message: "urlcode is missing" })

    }
    if (!shortid.isValid(urlCode)) {
      return res.status(400).send({ status: false, message: `${urlCode} is invalid urlcode` })
    }

    if (Object.keys(req.query).length > 0) {
      return res.status(400).send({ status: false, message: "oops!!! kya kar rha hai bhai tu query deke" })
    }
    //caching
    let cachedLongUrl = await GET_ASYNC(`${urlCode}`)
    console.log(cachedLongUrl)

    //if key name urlCode is present in cache memory
    if (cachedLongUrl) {
      return res.status(302).redirect(JSON.parse(cachedLongUrl))
    }

    //key urlcode is not present in cache memory
    const url = await UrlModel.findOne({ urlCode: urlCode }).select({ createdAt: 0, updatedAt: 0, __v: 0 })


    if (!url) {
      return res.status(404).send({ status: false, message: " no URL found" })
    }

    //using set to assign new key value pair in cache

    await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl))


    return res.status(302).redirect(url.longUrl)
  }

  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}



module.exports = { urlShortner, getUrl }