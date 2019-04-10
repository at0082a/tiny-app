var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set("view engine", "ejs")

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }
  

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL] //grabs the longURL from database
    res.redirect(longURL);
  });

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });
  
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
}); 

app.post("/urls", (req, res) => {
    let newId = generateRandomString()
    let longURL = req.body.longURL
    //let templateVars = { newId : longURL};  // Log the POST request body to the console
    urlDatabase[newId] = longURL // adds new entry into the database with key (shortURL) and value (longURL)
    res.redirect("/urls/" + newId);         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
delete urlDatabase[req.params.shortURL]
res.redirect("/urls")    
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});