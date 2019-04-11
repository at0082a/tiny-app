var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
app.use(cookieParser())
var PORT = 8080; // default port 8080
app.set("view engine", "ejs")

const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "abc"
  }
}

function urlsForUser(id) {
  let results = {};
  for (url in urlDatabase) {
  if (id === urlDatabase[url].userID) {
    results[url] = urlDatabase[url]
  }
  }
  console.log('these are the results', results);
  return results
}

function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }
  
  function checkLogin(email, password) {
    console.log('email', email);
    console.log('pass', password);
    for (user in users) {
      if (users[user].email === email && users[user].password === password) {
        return users[user]
      } 
    }
    return null;
  }

  function getCurrentUser (id) {
    for (user in users) {
      if (users[user].id === id) {
        return users[user]
      }
    }
  }

  function currentUser (req) {
    if (req.cookies["user_id"]) {
      return getCurrentUser(req.cookies["user_id"])  
    } else {
      console.log('you are not logged in')
      return undefined
    }
  }

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls", (req, res) => {
    let user = currentUser(req);
    console.log(user);
    let templateVars = { user: null, urls: []  }
           
    if (user && user.id) {
      templateVars = { 
        urls : urlsForUser(user.id),
        user : user 
      };
    }
    res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
    let user = currentUser(req)
    let templateVars = { user: user }
    res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let user = currentUser(req)  
  let templateVars = {user: user}
                      
  res.render("user_registration", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    let user = currentUser(req)
    let templateVars = {shortURL: req.params.shortURL, 
                        longURL: urlDatabase[req.params.shortURL].longURL, 
                        user: user };
      
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

app.get("/login", (req, res) => {
  let user = currentUser(req)
  let templateVars = { user: user }
  res.render("user_login", templateVars)
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10)
    const user = checkLogin(email, hashedPassword);
    
    if (user) {
      res.cookie('user_id', user.id)
    } else {
      res.status(403).send('Please enter valid username and password');
    }           
    res.redirect("/urls");       
});

app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  let newLongURL = req.body.longURL //longURL comes from the "name" of the input field in the urls index ejs page
  console.log("Cookies", req.cookies);
   // adds new entry into the database with key (shortURL) and value (longURL)
  
    if (req.cookies.user_id) {
      urlDatabase[newId] = { longURL : newLongURL, userID : req.cookies['user_id'] }
    } else {
      res.status(403).send('Please login to view your URLs');
    }
  res.redirect("/urls/")
});

app.post("/logout", (req, res) => {  
  res.clearCookie('user_id'); 
  res.redirect("/login");           // Respond with 'Ok' (we will replace this)
});

app.post("/register", (req, res) => {
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  console.log(hashedPassword);
  

  if (!newEmail || !newPassword)   {
    res.status(404);
  } else if (checkLogin(newEmail, hashedPassword)) {
    res.status(404).send('You are already registered')
  } else {
      users[newId] = { id : newId,
        email : newEmail, 
        password : hashedPassword }
    
    res.cookie('user_id', newId)
    res.redirect("/urls")
  }
});
  
app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL]
res.redirect("/urls")    
});

app.post("/urls/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL // grabs shorturl from URL in browser (denoted by the :)
    let longURL = req.body.newURL //grabs the long url from the input field in urls show ejs
    urlDatabase[shortURL] = {longURL : longURL, userID : req.cookies['user_id']}
res.redirect("/urls/") 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});