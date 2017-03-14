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


app.get("/", (req, res) => {
  res.end("Hello! Welcome to express_server");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
