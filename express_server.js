const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var tagline = "Any code of your own that you haven't looked at for six or more months might as well have been written by someone else.";

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
