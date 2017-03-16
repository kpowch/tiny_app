# TinyApp
## W2D2-5 Project 2
[Project link](https://web-compass.lighthouselabs.ca/projects/w2-url-shortener)

As of 2017-03-14

## Goal
This three-day project will have you building a tiny (pun intended) web app using Node. The app will allow users to shorten long URLs much like TinyURL.com, bit.ly, and the like.

Unlike last project where you build an HTTP Client which makes requests to the GitHub server, this one will have you building the HTTP Server to handle requests from the browser (client).

You'll get introduced to some more advanced JavaScript and node concepts and also learn more about Express, a mini web framework which is extremely popular in the node community.

By the end of the week you will hopefully also have deployed it the "Cloud" so that anyone can use it.

## Functional Requirements
As an avid twitter poster, I want to be able to shorten links so that I can fit more non-link text in my tweets.
<ul>
<li> When I visit `http://localhost:3000/` <br> Then I see a form which contains a field to submit a URL and a button

<li> When I fill in the form with a URL and submit it <br> Then I see a page with the original URL, a short URL and link to go back to the submission form
</ul>

As an avid twitter poster, 
I want to be able to see how many times my subscribers visit my links so that I can learn what content they like.
<ul>
<li> When I visit `http://localhost:3000/` <br> Then I see a login form

<li> When I submit the login form <br> Then I am logged in

<li> Given I submitted links when I was logged in When I visit `/urls` <br> Then I see my links and the number of visits each had
</ul>

As a twitter reader, I want to be able to visit sites via shortened links, so that I can read interesting content.
<ul>
<li> When I visit a short link <br>
Then I am redirected to the page corresponding to the short URL's original URL
</ul>


## Technical Specification
### `GET /`

if user is logged in: redirect -> `/urls` 

if user is not logged in: redirect -> `/login`

### `GET /urls`

if user is not logged in: returns a 401 response, HTML with a relevant error message and a link to `/login`

if user is logged in: returns a 200 response, HTML with:
<ul> 
<li> the site header (see below)
<li> a table of urls the user has created, each row:
	<ul>
	<li> short url
	<li> long url
	<li> edit button -> `GET /urls/:id`
	<li> delete button -> `POST /urls/:id/delete`
	<li> date created (stretch)
	<li> number of visits (stretch)
	<li> number of unique visits (stretch)
	</ul>
<li> a link to "Create a New Short Link" -> `/urls/new`
</ul>

### `GET /urls/new`

if user is not logged in: returns a 401 response, HTML with:
<ul>
<li> error message
<li> a link to `/login`
</ul>

if user is logged in: returns a 200 response, HTML with:
<ul>
<li> the site header (see below)
<li> a form, which contains:
	<ul>
	<li> text input field for the original URL
	<li> submit button -> `POST /urls`
	</ul>
</ul>

### `GET /urls/:id`

if url with `:id` does not exist: returns a 404 response, HTML with a relevant error message

if user is not logged in: returns a 401 response, HTML with a relevant error message and a link to /login

if logged in user does not match the user that owns this url: returns a 403 response, HTML with a relevant error message

if all is well: returns a 200 response, HTML with:
<ul>
<li> the short url
<li> date created (stretch)
<li> number of visits (stretch)
<li> number of unique visits (stretch)
<li> a form, which contains:
<li> the long url
<li> "update" button -> `POST /urls/:id`
<li> "delete" button -> `POST /urls/:id/delete`
</ul>

### `GET /u/:id`

if url with `:id` exists: redirect -> the corresponding longURL

otherwise: returns a 404 response, HTML with a relevant error message

### `POST /urls`

if user is logged in: generates a shortURL, saves the link and associates it with the user, then redirect -> `/urls/:id`

if user is not logged in: returns a 401 response, HTML with a relevant error message and a link to `/login`

### `POST /urls/:id`

if url with `:id` does not exist: returns a 404 response, HTML with a relevant error message

if user is not logged in: returns a 401 response, HTML with a relevant error message and a link to `/login`

if user does not match the url owner: returns a 403 response, HTML with a relevant error message

if all is well: updates the url, then redirect -> `/urls/:id`

### `GET /login`

if user is logged in: redirect -> `/`

if user is not logged in: returns a 200 response, HTML with:
<ul> 
<li> a form which contains:
<li> input fields for email and password
<li> submit button -> `POST /login`
</ul>

### `GET /register`

if user is logged in: redirect -> `/`

if user is not logged in: returns a 200 response, HTML with a form, which contains:
<ul>
<li> input fields for email and password
<li> "register" button -> `POST /register`
</ul>

### `POST /register`

if email or password are empty: returns a 400 response, with a relevant error message

if email already exists: returns a 400 response, with a relevant error message

if all is well:
<ul>
<li> creates a user
<li> encrypts their password with bcrypt
<li> sets a cookie
<li> redirect -> `/`
</ul>

### `POST /login`

if email & password params match an existing user:
<ul>
<li> sets a cookie
<li> redirect -> `/`
</ul>

if they don't match: returns a 401 response, HTML with a relevant error message

### `POST /logout`

for every logout,
<ul>
<li> deletes cookie
<li> redirect -> `/`
</ul>


### THE SITE HEADER:

if a user is logged in, the header shows:
<ul>
<li> user's email
<li> "My Links" link -> /urls
<li> logout button -> POST /logout
</ul>

if not logged in, the header shows:
<ul>
<li> a link to the log-in page /login
<li> a link to the registration page /register
</ul>

---

## Stack Requirements
<ul>
<li> ES6
<li> Node
<li> express
<li> git for version control
<li> cookie-session for session storage
<li> bcrypt for password encryption
</ul>

### Outcomes
<ul>
<li> can create an http server using a high level library (ex. express, sinatra)
<li> can make use of cookies in an HTTP server
<li> can use "cookie-parse" middleware to set and retrieve cookies
<li> can use curl to issue simple POST requests
<li> can use curl for non-trivial requests
<li> can use curl to issue a request with a cookie
<li> can use CDT to view cookies
<li> can use "express" to create a web server
<li> can explain what "ejs" does and what it is used for
<li> can explain the difference between <% %> and <%= %> in ejs
<li> can create and use ejs templates in a web application
<li> can configure and use a server-side template engine to generate HTML
<li> can explain what "template engines" are and why they are used
<li> can explain what "partials" are and why they are used
<li> can use partials
uses partials when appropriate
<li> can use labels in an HTML form
<li> can make use of common input field types
<li> can create a form to send a POST request
<li> can explain what is meant by an HTML "form" and what they are used for
<li> can explain the purpose of the action attribute in a form
<li> can explain the purpose of the method attribute in a form
<li> can explain how a HTTP redirect works and when it could be used
</ul>
