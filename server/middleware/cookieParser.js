const { Sessions } = require('../models');

const parseCookies = (req, res, next) => {
  let cookieObj = {};
  if (req.headers.cookie) {
    //TODO: this is better (no %20 or anything), but not quite right yet
    const cookieString = decodeURI(req.headers.cookie);

    let cookieKeyValues = cookieString.split(';').map(eachCookie => {
      return eachCookie.split('=');
    });
    cookieObj = Object.fromEntries(cookieKeyValues);
  } else {
    // create a new cookie

    // set it to cookieObj
  }
  res.cookie('test', cookieObj);

  next();
};

module.exports = parseCookies;