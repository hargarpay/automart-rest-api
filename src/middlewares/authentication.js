import jwt from 'jsonwebtoken';
// import debug from 'debug';

// const middlewareDebug = debug('automart:middlewareDebug');
// const bcryptSalt = process.env.BCRYPT_SALT;
const jwtSalt = process.env.SECRET_KEY || 'test';


export const verifyToken = (req, res, next) => {
  const authorization = req.headers['x-access-token'];
  //   middlewareDebug(authorization);
  if (!/^Bearer\s+/.test(authorization)) return res.status(403).send({ status: false, message: 'Not authorized' });
  const token = authorization.replace(/^Bearer\s+/, '');
  if (!token) return res.status(403).send({ status: false, message: 'Invalid Token' });
  return jwt.verify(token, jwtSalt, (err, decode) => {
    if (err) return res.status(401).send({ status: false, message: 'Fail to authenticate' });
    req.userId = decode.id;
    return next();
  });
};

export const verifyRole = (req, res, next) => {
  next();
};
