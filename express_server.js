const express = require('express');
// const cookieParser = require('cookie-parser'); // cookie version
const cookieSession = require('cookie-session'); // session version
const bcrypt = require('bcrypt'); // password encryption
const bodyParser = require('body-parser'); // allows us to POST request parameters
const methodOverride = require('method-override');
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

// override with POST having ?_method=<method like PUT, POST, DELETE, etc.>
app.use(methodOverride('_method'));

// ----- HARDCODED DATABASES -----
// TODO: export database to a file or something so that new user info is kept
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'user2k4ks',
    visits: {
      'visitor02kfs': ['Sun Mar 19 2017 23:16:05 GMT+0000 (UTC)', 'Sun Mar 19 2017 23:16:49 GMT+0000 (UTC)'],
      'visitorlsk2j': ['Sat Mar 18 2017 13:25:34 GMT+0000 (UTC)']
    }
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'user2k30s',
    visits: {
      'visitor02kfs': ['Sat Mar 18 2017 13:25:34 GMT+0000 (UTC)', 'Sun Mar 19 2017 23:16:49 GMT+0000 (UTC)']
    }
  },
  '4k4fwp': {
    longURL: 'http://www.example.com',
    userID: 'userlg0sl',
    visits: {}
  }
};

const usersDatabase = {
  'user2k4ks': {
    id: 'user2k4ks',
    name: 'Whymer Chrisy',
    email: 'user@example.com',
    password: bcrypt.hashSync('asf', 10)
  },
  'user2k30s': {
    id: 'user2k30s',
    name: 'Alec Pete',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  },
  'userlg0sl': {
    id: 'userlg0sl',
    name: 'Sven Coryson',
    email: 'user3@example.com',
    password: bcrypt.hashSync('asdf', 10)
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
returns: true if value of propKey in the object is propValue
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
parameters: id (str) (i.e. userid)
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
Checks if the input URL (longURL) is valid - i.e. starts with http:// or https://
parameters: a url address
returns: true if valid; false otherwise
*/
function isValidURL(address) {
  if (address.substring(0, 7) === 'http://' || address.substring(0, 8) === 'https://') {
    return true;
  } else {
    return false;
  }
}

/*
Tracks analystics of session users visiting /u/:shortURL
parameters: req object (which contains cookie info and the shortURL they're visiting)
returns: nothing. adds new timestamp to urlDatabase associated with user/visitor cookie.
*/
// TODO: don't user user_id, get rid of console.logs
function track(req) {
  const visitsInDatabase = urlDatabase[req.params.shortURL]['visits'];

  // creates visitor_id cookie (doesn't use user_id)
  if (!req.session.visitor_id) {
    req.session.visitor_id = 'visitor' + generateRandomString(5);
  }

  if (visitsInDatabase[req.session.visitor_id]) {
    visitsInDatabase[req.session.visitor_id].push(Date());
    return;
  } else {
    visitsInDatabase[req.session.visitor_id] = [Date()];
    return;
  }
}

/*
Calculates the total number of visits and total number of unique visits for a given shortURL
parameters: shortURL (str)
returns: object with totalVisits (num), uniqueVisits (num), and allVisits (obj)
*/
function analytics(shortURL) {
  const uniqueVisits = Object.keys(urlDatabase[shortURL].visits).length;

  let totalVisits = 0;
  for (let visitor in urlDatabase[shortURL].visits) {
    totalVisits += Object.keys(urlDatabase[shortURL].visits[visitor]).length;
  }

  const allVisits = urlDatabase[shortURL].visits;

  return {
    totalVisits: totalVisits,
    uniqueVisits: uniqueVisits,
    allVisits: allVisits
  };
}


// ----- ENDPOINT FUNCTIONS -----

/*
Root
- if logged in: redirect to /urls;
- if not logged in: redirect to /login
*/
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

/*
URL index page
- if logged in: return 200 response, show site header, show table of urls
  (short urls, long url, edit/delete buttons) that belong to user, and link to add new shortURL;
- if not logged in: return 401 response, html with relevant eror message and link to /login
*/
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: usersDatabase[req.session.user_id]
  };

  if (req.session.user_id) {
    res.render('urls_index', templateVars);
  } else {
    res.status(401);
    templateVars['statusCode'] = 401;
    templateVars['message'] = 'Please log in or register.';
    res.render('urls_error', templateVars);
  }
});

/*
Create new shortURL page
- if logged in: return 200 response, show site header, show form with text input field
  for original URL and submit button;
- if not logged in: return 401 response, html with relevant eror message and link to /login
*/
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.status(401);
    templateVars['statusCode'] = 401;
    templateVars['message'] = 'Please log in or register.';
    res.render('urls_error', templateVars);
  }
});

/*
Specifc shortURL page
- if not logged in: return 401 response, html with relevant eror message and link to /login
- if page doesn't exist, return 404 response, html with relevant error message
- if logged in and URL doesn't belong to user, return 403 response, html with relevant error message
- if logged in and above cases pass: return 200 response, show shortURL, show
  form with longURL and update/delete buttons
*/
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };
  if (!req.session.user_id) {
    res.status(401);
    templateVars['statusCode'] = 401;
    templateVars['message'] = 'Please log in or register.';
    res.render('urls_error', templateVars);
  } else if (!urlDatabase[req.params.id]) {
    res.status(404);
    templateVars['statusCode'] = 404;
    templateVars['message'] = req.params.id + ' is not a valid shortURL.';
    res.render('urls_error', templateVars);
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(403);
    templateVars['statusCode'] = 403;
    templateVars['message'] = req.params.id + ' is not a shortURL that belongs to you.';
    res.render('urls_error', templateVars);
  } else {
    templateVars['shortURL'] = req.params.id;
    templateVars['urls'] = urlDatabase;
    templateVars['analytics'] = analytics(req.params.id);
    res.render('urls_show', templateVars);
  }
});

/*
Response to delete button
delete URL and remove it from urlDatabase
*/
app.delete('/urls/:id/delete', (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403);
    const templateVars = {
      user: usersDatabase[req.session.user_id],
      statusCode: 403,
      message: req.params.id + ' is not a shortURL that belongs to you.'
    };
    res.render('urls_error', templateVars);
  }
});

/*
Link to actual URL (longURL)
- for all users, logged in/registered or not
- if url exists: redirect to corresponding longURL
- if url doesn't exist: return 404 response, html with relevant error message
*/
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    // TODO: add analytics to urlDatabase
    track(req);
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
- if logged in: generate shortURL, save link and associated user in urlDatabase,
and redirect to /urls/:id
- if not logged in: return 401 response, html with relevant eror message and link to /login
*/
app.post('/urls', (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  if (req.session.user_id && isValidURL(req.body.longURL)) {
    const newShortURL = generateRandomString(6);
    urlDatabase[newShortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      visits: {}
    };
    res.redirect(`/urls/${newShortURL}`);
  // additional check to make sure their longURL starts with http://
  } else if (!isValidURL(req.body.longURL)) {
    res.status(406);
    templateVars['statusCode'] = 406;
    templateVars['message'] = 'Please enter valid longURL (starts with http:// or https://).';
    res.render('urls_error', templateVars);
  } else {
    res.status(401);
    templateVars['statusCode'] = 401;
    templateVars['message'] = 'Please log in or register.';
    res.render('urls_error', templateVars);
  }
});

/*
Response to update button
- if not logged in: return 401 response, html with relevant eror message and link to /login
- if page doesn't exist, return 404 response, html with relevant error message
- if logged in and URL doesn't belong to user, return 403 response, html with relevant error message
- if logged in and above cases pass: update url in urlDatabase and redirect to /urls/:id
*/
// TODO: add checks above
app.put('/urls/:id', (req, res) => {
  if (!isValidURL(req.body.longURL)) {
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
- if logged in, redirect to /
- if not logged in: return 200 response, show form with email and password input
  fields and submit button
*/
app.get('/login', (req, res) => {
  if (req.session.user_id) {
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
- if logged in, redirect to /
- if not logged in: return 200 response, show form with email and password input
  fields and register button
*/
app.get('/register', (req, res) => {
  if (req.session.user_id) {
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
- if input fields are empty: return 400 reponse, html with relevant error message
- if email already exists: return 400 response, html with relevant error message
- if above passes: create user in usersDatabase, encrypt password with bcrypt,
  set cookie, and redirect to /
*/
app.post('/register', (req, res) => {
  const emailExists = propInUserDatabase(usersDatabase, 'email', req.body.email);

  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  if (!req.body.name || !req.body.email || !req.body.password) {
    res.status(400);
    templateVars['statusCode'] = 400;
    templateVars['message'] = 'Name, email, or password field empty.';
    res.render('urls_error', templateVars);
  } else if (emailExists) {
    res.status(400);
    templateVars['statusCode'] = 400;
    templateVars['message'] = 'Email is already registered.';
    res.render('urls_error', templateVars);
  } else {
    let randomUserId = 'user' + generateRandomString(5);
    usersDatabase[randomUserId] = {
      id: randomUserId,
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    // set cookie
    req.session.user_id = randomUserId;

    res.redirect('/');
  }
});

/*
Response to login button
- if email and password parameters match existing user: set cookie and redirect to /
- if parameters don't match user: return 401 response, html with relevant error message
*/
app.post('/login', (req, res) => {
  // recall function returns associated key (userid) if the password/email combo is a match; false otherwise
  const isMatch = passwordMatch(req.body.email, req.body.password);
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  // additional check to make sure they didn't leave a field blank
  if (!req.body.email || !req.body.password) {
    res.status(400);
    templateVars['statusCode'] = 400;
    templateVars['message'] = 'Email or password field empty.';
    res.render('urls_error', templateVars);
  } else if (isMatch) {
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
- delete cookie and redirect to /
*/
app.delete('/logout', (req, res) => {
  // res.clearCookie('user_id');
  req.session.user_id = null;
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
  res.render('urls_error', templateVarsError);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
