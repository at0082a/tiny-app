var express = require("express");
var cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
var PORT = 8080; // default port 8080

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

function generateHashedPassword (value) {
  const hashedPassword = bcrypt.hashSync(value, 10);
  return hashedPassword;
}

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: generateHashedPassword("123")
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: generateHashedPassword("abc")
  }
}

function urlsForUser(id) {
  let results = {};
  for (url in urlDatabase) {
  if (id === urlDatabase[url].userID) {
    results[url] = urlDatabase[url];
  }
  }
  return results;
}

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text;
}
  
function checkLogin(email, password) {
  for (user in users) {
  var isCorrectPassword = bcrypt.compareSync(password, users[user].password); // returns true
    if (users[user].email === email && isCorrectPassword) {
        return users[user];
      }
    }   
  return null;
}
 
function getCurrentUser (id) {
  for (user in users) {
    if (users[user].id === id) {
    return users[user];
    }
  }
}

function currentUser (req) {
  if (req.session.user_id) {
    return getCurrentUser(req.session.user_id)  ;
  } else {
    return undefined;
  }
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => { //to retrieve and render data on home page
  let user = currentUser(req);
  let templateVars = { user: null, urls: []  };
           
  if (user && user.id) {
    templateVars = { 
      urls : urlsForUser(user.id),
      user : user 
    } 
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = currentUser(req);
  let templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let user = currentUser(req);  
  let templateVars = {user: user};
                      
  res.render("user_registration", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    let user = currentUser(req);
    let newUser = urlDatabase[req.params.shortURL].userID

    console.log(user);
    console.log(newUser)
    let templateVars = {shortURL: req.params.shortURL, 
                        longURL: urlDatabase[req.params.shortURL].longURL, 
                        user: user };
    if (user === undefined || !urlDatabase[req.params.shortURL]) {
      res.status(404).send('Please login or register');
    } else if (user.id !== newUser) {
      res.status(404).send('Please login to edit your own URLs');
    } else {
      res.render("urls_show", templateVars);
    }
    
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]; //grabs the longURL from database. "shortURL" in params comes from the "shortURL" in the browser link.
    
  if (longURL === undefined) {
    res.status(404).send('Invalid shortURL');
  } else {
    res.redirect(longURL.longURL);
  }  
  });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
  });
  
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
}); 

app.get("/login", (req, res) => {
  let user = currentUser(req);
  let templateVars = { user: user };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = checkLogin(email, password); //returns the user object for the specified login credentials.

  if (user) {
    req.session.user_id = user.id;
      // res.cookie('user_id', user.id)
    } else {
      res.status(403).send('Please enter valid username and password');
    }           
    res.redirect("/urls");       
});

app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  let newLongURL = req.body.longURL; //longURL comes from the "name" of the input field in the urls index ejs page
   // adds new entry into the database with key (shortURL) and value (longURL)
    if (req.session.user_id) {
      urlDatabase[newId] = { longURL : newLongURL, userID : req.session.user_id };
    } else {
      res.status(403).send('Please login to create a URL');
    }
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {  
  req.session = null;
  res.redirect("/login");           // Respond with 'Ok' (we will replace this)
});

app.post("/register", (req, res) => {
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  if (!newEmail || !newPassword)   {
    res.status(404).send('Please enter valid registration credentials');
  } else if (checkLogin(newEmail, newPassword)) {
    res.status(404).send('You are already registered')
  } else {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
      users[newId] = { id : newId,
        email : newEmail, 
        password : hashedPassword }
    
    req.session.user_id = newId;
    // req.session('user_id', newId)
    res.redirect("/urls");
  }
});
  
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
res.redirect("/urls");    
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL; // grabs shorturl from URL in browser (denoted by the :)
  let longURL = req.body.newURL; //grabs the long url from the input field in urls show ejs
  urlDatabase[shortURL] = { longURL : longURL, userID : req.session.user_id };
res.redirect("/urls/") 
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});