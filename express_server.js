const express = require('express');
const app = express();
// sets the port, defaults to 8080
const PORT = process.env.PORT || 3000;
// for template engine
app.set('view engine', 'ejs');
// body-parser middleware that allows us to POST request parameters
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// to track cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());


const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const usersDatabase = {
  'userRandomID': {
    id: 'userRandomID',
    name: 'John Smith',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    name: 'Janice Smart',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};






function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

// returns true if the input value parameter matches that in the user database
function propInUserDatabase(propKey, propValue) {
  for (let key in usersDatabase) {
    if (usersDatabase[key][propKey] === propValue) {
      return true;
    }
  }
  return false;
}

function passwordMatch(email, password) {
  for (let key in usersDatabase) {
    if (usersDatabase[key].email === email && usersDatabase[key].password === password) {
      return key;
    }
  }
  return false;
}




// note they both go to /urls because there is no login page
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
      password: req.body.password
    };
    // console.log(usersDatabase);
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
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// Retrieve index page of all URLs
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: undefined
  };
  if (req.cookies.user_id) {
    templateVars.user = usersDatabase[req.cookies.user_id];
  }

  res.render('urls_index', templateVars);
  //}
});

// Update specified URL
app.post('/urls/:id', (req, res) => {
  if(!req.body.longURL) {
    res.end('need to put new URL');
  } else {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect('/urls');
  }
});

// Delete specified URL
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Retrieve specified URL
// note: this must be after the /urls/new and /urls/:id/delete otherwise they don't work
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: undefined
  };
  if (req.cookies.user_id) {
    templateVars.user = usersDatabase[req.cookies.user_id];
  }

  if(!urlDatabase[req.params.id]) {
    res.status(404).send("<img src='https://http.cat/404' alt='404! Page not found.' style='width:100%;'>");
  } else {
    res.render('urls_show', templateVars);
  }
});

// to redirect short URLs to their longURL page
app.get('/u/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: undefined
  };
  if (req.cookies.user_id) {
    templateVars.user = usersDatabase[req.cookies.user_id];
  }

  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).send("<img src='https://http.cat/404' alt='404! Page not found.' style='width:100%;'>");
    // res.sendStatus(404) // equivalent to res.status(404).send('Not Found')
  } else {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
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
