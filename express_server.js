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
  return Math.random().toString(36).substring(2, 8);
}


app.get("/", (req, res) => {
  res.send("Hello! Welcome to TinyApp!");
});

// Create short URL for inputted long URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// Retrieve index page of all URLs
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Update specified URL
app.post("/urls/:id", (req, res) => {
  if(!req.body.longURL) {
    res.end('need to put new URL');
  } else {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect('/urls');
  }
});

// Delete specified URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Retrieve specified URL
// note: this must be after the /urls/new and /urls/:id/delete otherwise they don't work
app.get("/urls/:id", (req, res) => {
  if(!urlDatabase[req.params.id]) {
    res.status(404).send('<img src="https://http.cat/404" alt="404! Page not found." style="width:100%;">');
    // res.sendStatus(404) // equivalent to res.status(404).send('Not Found')
  } else {
    const templateVars = { shortURL: req.params.id, urls: urlDatabase };
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
