const UrlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const shortid = require('shortid')

const urlShortner = async (req,res) => {
    try
    {
        let longUrl = req.body.longUrl

        if(!longUrl){
            return res.status(400).send({status:false , message: "please enter a URL"})
        }

        //url validation
        if(!validUrl.isUri(longUrl)){
            return res.status(400).send({status:false , message: "please enter a valid URL"})
        }

        const isUrlPresent = await UrlModel.findOne({longUrl})

        //if url is already present
        if(isUrlPresent){
            return res.status(200).send({status:true , data: isUrlPresent})
        }

        //base url
        const baseUrl = 'http://localhost:3000'

        //url code generation
        const urlCode = shortid.generate()
        console.log(urlCode)

        const shortUrl = baseUrl + '/' + urlCode
        console.log(shortUrl)

        const url = await UrlModel.create({longUrl:longUrl,shortUrl:shortUrl,urlCode:urlCode})
        return res.status(201).send({status:true ,message:"successs", data: url})

    }
    catch(err){
        return res.status(500).send({status:false ,message: err.message})
    }
}

const getUrl = async (req,res) => {
    try
    {

    }
    catch(err){
        return res.status(500).send({status:false ,message: err.message})
    }
}

module.exports = {urlShortner , getUrl}