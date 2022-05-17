const express = require('express');
const router = express.Router();

const UrlController = require('../controller/urlController')



router.post("/url/shorten",UrlController.urlShortner)

router.get("/:urlCode",UrlController.getUrl)



module.exports = router; 