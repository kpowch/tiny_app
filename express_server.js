const express = require('express');
// const cookieParser = require('cookie-parser'); // cookie version
const cookieSession = require('cookie-session'); // session version
const bcrypt = require('bcrypt');

// body-parser middleware that allows us to POST request parameters
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;

// ----- DEFINE APP AND MIDDLEWARE -----
const app = express();
app.set('view engine', 'ejs');
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  secret: 'encryptingstuff',
  // cookie options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

// ----- HARDCODED DATABASES -----
// TODO: export database to a file or something so that new user info is kept
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
    name: 'User Namename',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    name: 'Cool Lastname',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  }
};

// ----- HELPER FUNCTIONS -----

/*
Generates a random alphanumeric string of specified length.
patameters: length (num)
returns: alphanumeric string (str)
*/
function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

/*
Checks if a property-value pair exists in an object.
parameters: propKey (e.g. 'email'), propValue (e.g. 'example@email.com'), and object (e.g. usersDatabase)
returns: true if the propKey in the object is the propValue
*/
function propInUserDatabase(object, propKey, propValue) {
  for (let key in object) {
    if (object[key][propKey] === propValue) {
      return true;
    }
  }
  return false;
}

/*
Checks if the email-password combo exists in the usersDatabase
parameters: email (str), password (str, hashed)
returns: if match found, returns associated key (i.e. userid); false otherwise
*/
function passwordMatch(email, password) {
  for (let key in usersDatabase) {
    if (usersDatabase[key].email === email
        && bcrypt.compareSync(password, usersDatabase[key].password)) {
      return key;
    }
  }
  return false;
}

/*
Searches for the URLs that belong to a specific user
parameters: id (str) - userid
returns: an object of urls that below to the user
*/
function urlsForUser(id) {
  let urlsForUser = {};
  for (let prop in urlDatabase) {
    if (urlDatabase[prop].userID === id) {
      urlsForUser[prop] = urlDatabase[prop];
    }
  }
  return urlsForUser;
}

/*
Checks if the input URL (longURL) is valid - i.e. starts with http:// and not empty
parameters: url
returns: true if valid; false otherwise
*/
function isValidURL(address) {
  if (address.substring(0, 7) === 'http://') {
    return true;
  } else {
    return false;
  }
}

// ----- ENDPOINT FUNCTIONS -----

/*
Root
if logged in, go to /urls; otherwise go to /login
*/
app.get('/', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

/*
URL index page
if logged in, shows urls belonging to user; otherwise error to login.
*/
app.get('/urls', (req, res) => {
  // console.log(usersDatabase[req.session.user_id])
  if (req.session.user_id) {
    const templateVars = {
      urls: urlsForUser(req.session.user_id),
      user: usersDatabase[req.session.user_id]
    };
    res.render('urls_index', templateVars);
  } else {
    res.status(401);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 401,
      message: 'Please log in or register.'
    });
  }
});

/*
Create new shortURL
if logged in, render create new page; otherwise error to login
*/
// TODO the link has to start with http:// - should make an error? or concatenate on?
app.get('/urls/new', (req, res) => {
  if(req.session.user_id) {
    let templateVars = {
      user: usersDatabase[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  } else {
    res.status(401);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 401,
      message: 'Please log in or register.'
    });
  }
});

/*
Specifc shortURL page
if logged in, show information of the current shortURL and allow edits/deletions/creations;
if not logged in, show error to login
*/
app.get('/urls/:id', (req, res) => {
  // if the user is not logged in, return 401 response
  if(!req.session.user_id) {
    res.status(401);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 401,
      message: 'Please log in or register.'
    });
  // if url doesn't exist, send 404 response
  } else if (!urlDatabase[req.params.id]) {
    res.status(404);
    const templateVarsError = {
      user: usersDatabase[req.session.user_id],
      statusCode: 404,
      message: req.params.id + ' is not a valid shortURL.'
    };
    res.render('urls_error', templateVarsError);
  // if user does not own url, return 403 response
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(403);
    const templateVarsError2 = {
      user: usersDatabase[req.session.user_id],
      statusCode: 403,
      message: req.params.id + ' is not a link that belongs to you.'
    };
    res.render('urls_error', templateVarsError2);
  // otherwise, user is logged in, url exists and belongs to user, and page can be shown
  } else {
    const templateVars = {
      shortURL: req.params.id,
      urls: urlDatabase,
      user: usersDatabase[req.session.user_id]
    };
    res.render('urls_show', templateVars);
  }
});

/*
Response to delete button
deletes URL and removes it from urlDatabase
*/
// TODO: might not have to check if it belongs to user since user can only see the ones that belong to them
app.post('/urls/:id/delete', (req, res) => {
  if(urlDatabase[req.params.id].userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.send('you can only delete your own links');
  }
});

/*
Link to actual URL (longURL)
redirects short URL address to longurl page
works if user is not logged in or registered
*/
app.get('/u/:shortURL', (req, res) => {
  if(urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(404);
    const templateVarsError = {
      user: usersDatabase[req.session.user_id],
      statusCode: 404,
      message: 'This is not a valid address.'
    };
    res.render('urls_error', templateVarsError);
  }
});

/*
Response to create new url link
creates new link and adds to url database
only for logged in users
*/
app.post('/urls', (req, res) => {
  if (req.session.user_id && isValidURL(req.body.longURL)) {
    const newShortURL = generateRandomString(6);
    urlDatabase[newShortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${newShortURL}`);
  } else if (!isValidURL(req.body.longURL)) {
    res.status(406);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 406,
      message: 'Please enter valid longURL (starts with http://).'
    });
  } else {
    res.status(401);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 401,
      message: 'Please log in or register.'
    });
  }
});

/*
Response to update button
updates longURL in urlDatabase
*/
// TODO: make check if edited url is empty or doesn't start with html
app.post('/urls/:id', (req, res) => {
  if(!isValidURL(req.body.longURL)) {
    res.status(406);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 406,
      message: 'Please enter valid longURL (starts with http://).'
    });
  } else {
    urlDatabase[req.params.id]['longURL'] = req.body.longURL;
    res.redirect('/urls/' + req.params.id);
  }
});

/*
Login page
if user already logged in, redirect; otherwise render login page
*/
app.get('/login', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/');
  } else {
    let templateVars = {
      user: usersDatabase[req.session.user_id]
    };
    res.render('urls_login', templateVars);
  }
});

/*
User registration
if user already logged in, redirect; else, render the register page
*/
app.get('/register', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/');
  } else {
    let templateVars = {
      user: usersDatabase[req.session.user_id]
    };
    res.render('urls_register', templateVars);
  }
});

/*
Response to register button
if all fields filled out and unique email, login, create cookie, and save user
*/
app.post('/register', (req, res) => {
  const emailExists = propInUserDatabase(usersDatabase, 'email', req.body.email);

  // if a field is not filled out, error
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.status(400);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 400,
      message: 'Please provide a name, email and password to register.'
    });

  // if email already exists, error
  } else if (emailExists) {
    res.status(400);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 400,
      message: 'Email is already registered.'
    });

  //otherwise create the user, hash the password, create cookie, and redirect to root
  } else {
    let randomUserId = 'user' + generateRandomString(5);
    usersDatabase[randomUserId] = {
      id: randomUserId,
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = randomUserId;

    res.redirect('/');
  }
});

/*
Response to login button
if password matches, save cookie and redirect; otherwise, show error to login page
*/
app.post('/login', (req, res) => {
  const isMatch = passwordMatch(req.body.email, req.body.password);

  if (isMatch) {
    req.session['user_id'] = isMatch;
    res.redirect('/');
  } else {
    res.status(401);
    res.render('urls_error', {
      user: usersDatabase[req.session.user_id],
      statusCode: 401,
      message: 'Login credentials are incorrect.'
    });
  }
});

/*
Response to logout button
deletes user_id cookies and redirects
*/
app.post('/logout', (req, res) => {
  // res.clearCookie('user_id');
  delete req.session.user_id;
  res.redirect('/');
});

/*
Catchall for any other invalid addresses
*/
app.get('/*', (req, res) => {
  res.status(404);
  const templateVarsError = {
    user: usersDatabase[req.session.user_id],
    statusCode: 404,
    message: 'This is not a valid address.'
  };
  if (req.session.user_id) {
    templateVarsError.user = usersDatabase[req.session.user_id];
  }
  res.render('urls_error', templateVarsError);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
