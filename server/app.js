const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookie = require('./middleware/cookieParser');
const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
//our custom middleware
app.use(cookie);
app.use(Auth.createSession);

const verifySession = (req, res, next) => Auth.verifySession(req, res, next);

app.get('/', Auth.verifySession, (req, res) => {
  res.render('index');
});

app.get('/create', Auth.verifySession, (req, res) => {
  res.render('index');
});

app.get('/links', Auth.verifySession, (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/logout', (req, res, next) => {
  models.Sessions.delete({ hash: req.session.hash })
    .then(() => {
      res.cookie('shortlyid', null);
      next();
    });

});

app.post('/login', (req, res) => {
  const { username, password: attempted } = req.body;
  //if person logged in is true, stay logged in aka access main page
  if (models.Sessions.isLoggedIn({ username })) {
    res.redirect('/');
  } else {
    //checks to see if credentials are correct and true
    models.Users.get({ username }).then(userData => {
      if (userData && models.Users.compare(attempted, userData.password, userData.salt)) {
        models.Sessions.update({ hash: req.session.hash }, { id: userData.id });
        // .then(() => res.redirect('/'));
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    });
  }
});

app.post('/signup', (req, res) => {
  const { username } = req.body;

  models.Users.get({ username }).then((userData) => {
    if (!userData) {
      //sign up person
      models.Users.create(req.body)
        .then((data) => models.Sessions.update({ hash: req.session.hash }, { userId: data.insertId }))
        .then(() => res.redirect('/'));
    } else {
      res.redirect('/signup');
    }
  });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
