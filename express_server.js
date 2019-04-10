var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
app.use(cookieParser())
var PORT = 8080; // default port 8080
app.set("view engine", "ejs")

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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
    let templateVars = { urls: urlDatabase,
                         username: req.cookies["username"] };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = { username: req.cookies["username"] }
    res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"] }
  res.render("user_registration", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, 
                        longURL: urlDatabase[req.params.shortURL],
                        username: req.cookies["username"] };

        console.log(typeof templateVars.username);
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL] //grabs the longURL from database. "shortURL" in params comes from the "shortURL" in the browser link.
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
    let longURL = req.body.longURL //longURL comes from the "name" of the input field in the urls index ejs page
    
    urlDatabase[newId] = longURL // adds new entry into the database with key (shortURL) and value (longURL)
    res.redirect("/urls/" + newId)
});

app.post("/login", (req, res) => {
    res.cookie('username', req.body.username); // grabs the username from the input in form of header partial.
    res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.post("/logout", (req, res) => {  
  res.clearCookie('username'); 
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});
  
app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL]
res.redirect("/urls")    
});

app.post("/urls/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL // grabs shorturl from URL in browser (denoted by the :)
    let longURL = req.body.newURL //grabs the long url from the input field in urls show ejs
    urlDatabase[shortURL] = longURL
res.redirect("/urls/") 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});