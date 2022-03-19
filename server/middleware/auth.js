const models = require('../models');
const Promise = require('bluebird');

const createNewCookie = function (req, res) {
  return models.Sessions.create()
    .then(result => {
      let id = result.insertId;
      return models.Sessions.get({ id });
    })
    .then(hashObj => {
      req.session = { hash: hashObj.hash };
      req.body.username && (req.session.user = { username: req.body.username });
      res.cookie('shortlyid', req.session.hash);
      return hashObj;
    });
};

module.exports.createSession = (req, res, next) => {
  if (req.cookies && req.cookies.shortlyid) { // session already exists
    let hash = req.cookies.shortlyid;

    models.Sessions.get({ hash })
      .then(result => {
        if (result) { // user has an associated session
          req.session = result;
          res.cookie('shortlyid', req.session.hash);
        } else { // user does not have a session
          return createNewCookie(req, res, next);
        }
      })
      .then(() => next())
      .catch(error => { console.log('Uh, oh. Promise chain error! ', error); next(error); });

  } else { //
    createNewCookie(req, res)
      .then(() => next())
      .catch(error => next(error));
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = function (req, res, next) {
  if (models.Sessions.isLoggedIn(req.session)) {
    next();
  } else {
    res.redirect('/login');
  }
};