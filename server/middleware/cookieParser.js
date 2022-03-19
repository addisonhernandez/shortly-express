const parseCookies = (req, res, next) => {
  let cookieObj = {};
  if (req.headers.cookie) {
    const cookieString = decodeURI(req.headers.cookie);

    let cookieKeyValues = cookieString.split('; ').map(eachCookie => {
      return eachCookie.split('=');
    });
    cookieObj = Object.fromEntries(cookieKeyValues);

    req.cookies = cookieObj;
  }

  next();
};

module.exports = parseCookies;