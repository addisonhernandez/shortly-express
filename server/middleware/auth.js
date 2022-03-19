const models = require('../models');
const Promise = require('bluebird');

const createNewCookie = function (req, res) {
  return models.Sessions.create()
    .then(result => {
      let id = result.insertId;
      return models.Sessions.get({ id });
    })
    .then(hashObj => {
      req.session = hashObj;
      res.cookie('shortlyid', req.session.hash);
      return hashObj;
    });
};

module.exports.createSession = (req, res, next) => {
  if (req.cookies && req.cookies.shortlyid) {
    let hash = req.cookies.shortlyid;

    models.Sessions.get({ hash })
      //sessions already exists
      .then(result => {
        if (result) {
          req.session = result;
          res.cookie('shortlyid', req.session.hash);
        } else {
          createNewCookie(req, res)
            .then(result => next(null, result))
            .catch(error => next(error));
        }
      })
      .then(result => next(null, result))
      .catch(error => next(error));

  } else {
    createNewCookie(req, res)
      .then(result => next(null, result))
      .catch(error => next(error));
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
