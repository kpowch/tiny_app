const express = require("express");
const app = express();
// sets the port, defaults to 8080
const PORT = process.env.PORT || 8080;
// for template engine
app.set("view engine", "ejs");
// body-parser middleware that allows us to POST request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let result = Math.random().toString(36).substring(2, 8);
  return result;
}


app.get("/", (req, res) => {
  res.send("Hello! Welcome to TinyApp!");
});

// index page of all URLs
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// page to generate short URL given long URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// page for individual URLs
// note: this must be after the /urls/new check otherwise new will be interpreted as :id
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('<img src="https://http.cat/404" alt="404! Page not found." style="width:100%;">');
    // res.sendStatus(404) // equivalent to res.status(404).send('Not Found')
  } else {
    let templateVars = { shortURL: req.params.id, urls: urlDatabase };
    res.render("urls_show", templateVars);
  }
});

// to redirect short URLs to their longURL page
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).send('<img src="https://http.cat/404" alt="404! Page not found." style="width:100%;">');
    // res.sendStatus(404) // equivalent to res.status(404).send('Not Found')
  } else {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
