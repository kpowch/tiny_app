const express = require('express');
// const cookieParser = require('cookie-parser'); // cookie version
const cookieSession = require('cookie-session') // session version
const bcrypt = require('bcrypt');

// body-parser middleware that allows us to POST request parameters
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;

// ----- DEFINE APP AND MIDDLEWARE -----
const app = express();
app.set('view engine', 'ejs');
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: process.env.SESSION_SECRET || 'encryptingstuff',
  // cookie options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

// ----- HARDCODED DATABASES -----
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'userRandomID'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'user2RandomID'
  }
};

const usersDatabase = {
  'userRandomID': {
    id: 'userRandomID',
    name: 'John Smith',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    name: 'Janice Smart',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  }
};

// ----- HELPER FUNCTIONS -----

// generates a random alphanumeric string of specified length
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

// returns true if the input value parameter matches that in the user database
// e.g. ('email', 'email@email.com') checks if email@email.com is an existing email
function propInUserDatabase(propKey, propValue) {
  for (let key in usersDatabase) {
    if (usersDatabase[key][propKey] === propValue) {
      return true;
    }
  }
  return false;
}

// given a email and hashed password, checks if it's in the database
// returns the matching usersDatabase key (i.e userid) if there's a match; false otherwise
function passwordMatch(email, password) {
  for (let key in usersDatabase) {
    if (usersDatabase[key].email === email
        && bcrypt.compareSync(password, usersDatabase[key].password)) {
      return key;
    }
  }
  return false;
}

// returns object of urls that below to the id user
function urlsForUser(id) {
  let urlsForUser = {};
  for (let prop in urlDatabase) {
    if (urlDatabase[prop].userID === id) {
      urlsForUser[prop] = urlDatabase[prop]
    }
  }
  return urlsForUser;
}

// ----- ENDPOINT FUNCTIONS -----
app.get('/', (req, res) => {
  if(req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// user registration
app.get('/register', (req, res) => {
  if(req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: null
    };
    res.render('urls_register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const emailExists = propInUserDatabase('email', req.body.email);

  if(req.body.name && req.body.email && req.body.password && !emailExists) {
    let user_id = 'user' + generateRandomString(5);
    usersDatabase[user_id] = {
      id: user_id,
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    res.cookie('user_id', user_id);
    res.redirect('/urls');
  } else {
    res.status(400);
    res.send('you left a field blank or your email is taken');
  }
});

app.get('/login', (req, res) => {
  if(req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: undefined
    };
    res.render('urls_login', templateVars);
  }
});

// to handle a login/save cookie for a user
app.post('/login', (req, res) => {
  const isMatch = passwordMatch(req.body.email, req.body.password);

  if (isMatch) {
    res.cookie('user_id', isMatch);
    res.redirect('/');
  } else {
    res.status(403);
    res.send('password or email incorrect');
  }
});

// logout user and clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

// Create short URL for inputted long URL
//TODO the link has to start with http:// - should make an error? or concatenate?
app.get('/urls/new', (req, res) => {
  if(req.cookies.user_id) {
    let templateVars = {
      user: usersDatabase[req.cookies.user_id]
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post('/urls', (req, res) => {
  const newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${newShortURL}`);
});

// Retrieve index page of all URLs
app.get('/urls', (req, res) => {
  if (req.cookies.user_id) {
    const templateVars = {
      urls: urlsForUser(req.cookies.user_id),
      user: usersDatabase[req.cookies.user_id]
    };
    res.render('urls_index', templateVars);
  } else {
    res.send('not logged in')
  }
});

// Update specified URL
app.post('/urls/:id', (req, res) => {
  if(!req.body.longURL) {
    res.end('need to put new URL');
  } else {
    urlDatabase[req.params.id]['longURL'] = req.body.longURL;
    res.redirect('/urls');
  }
});

// Delete specified URL
app.post('/urls/:id/delete', (req, res) => {
  if(urlDatabase[req.params.id].userID === req.cookies.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.send('you can only delete your own links')
  }
});

// Retrieve specified URL
// note: this must be after the /urls/new and /urls/:id/delete otherwise they don't work
app.get('/urls/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("<img src='https://http.cat/404' alt='404! Page not found.' style='width:100%;'>");
  }

  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    const templateVars = {
      shortURL: req.params.id,
      urls: urlDatabase,
      user: usersDatabase[req.cookies.user_id]
    };
    res.render('urls_show', templateVars);
  } else {
    res.send('you can only edit your own links')
  }
});

// to redirect short URLs to their longURL page
app.get('/u/:shortURL', (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).send("<img src='https://http.cat/404' alt='404! Page not found.' style='width:100%;'>");
    // res.sendStatus(404) // equivalent to res.status(404).send('Not Found')
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

/* TODO: send any error to a custom 404 page. then update the above 404 pages to this page.
app.get('*', (req, res) => {
  const templateVars = {
    user: usersDatabase[req.cookies].name
  };
  res.status(404);
  res.redirect('urls_404', templateVars);
});
*/

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
