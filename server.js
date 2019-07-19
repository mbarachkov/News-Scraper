var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var moment = require("moment");
var cheerio = require("cheerio");
var request = require("request");
var db = require("./models");
var PORT = process.env.PORT || 3000;
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", function(req, res) {
  res.send(index.html);
});
app.get("/scrape", function(req, res) {
  
  request("https://www.invisionapp.com/blog", function(error, response, html) {
    var $ = cheerio.load(html);
    $(".title-link").each(function(i, element) {
      var title = $(element).children().text();
      var link = $(element).attr("href");
      var snippet = $(element).siblings('p').text().trim();
      var articleCreated = moment().format("YYYY MM DD hh:mm:ss");
      var result = {
        title: title,
        link: link,
        snippet: snippet,
        articleCreated: articleCreated,
        isSaved: false
      }
      console.log(result);
      db.Article.findOne({title:title}).then(function(data) {
        console.log(data);
        if(data === null) {
          db.Article.create(result).then(function(dbArticle) {
            res.json(dbArticle);
          });
        }
      }).catch(function(err) {
          res.json(err);
      });
    });
  });
});
app.get("/articles", function(req, res) {
  db.Article
    .find({})
    .sort({articleCreated:-1})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.get("/articles/:id", function(req, res) {
  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.post("/articles/:id", function(req, res) {
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.put("/saved/:id", function(req, res) {
  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.get("/saved", function(req, res) {
  db.Article
    .find({ isSaved: true })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.put("/delete/:id", function(req, res) {
  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: false }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});