var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/newsAdmin', function(req, res, next){
  res.render('newsAdmin');
});

router.get('/weatherAdmin', function(req, res){
  res.render("weatherAdmin");
})

module.exports = router;
