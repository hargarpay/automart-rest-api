import jwt from 'jsonwebtoken';
import * as db from '../database/utilities/db-methods';
// import debug from 'debug';

// const middlewareDebug = debug('automart:middlewareDebug');
// const bcryptSalt = process.env.BCRYPT_SALT;
const jwtSalt = process.env.SECRET_KEY || 'test';
const table = 'users';

export const verifyToken = (req, res, next) => {
  const authorization = req.headers['x-access-token'];
  //   middlewareDebug(authorization);
  if (!/^Bearer\s+/.test(authorization)) return res.status(403).send({ success: false, message: 'Not authorized' });
  const token = authorization.replace(/^Bearer\s+/, '');
  if (!token) return res.status(403).send({ success: false, message: 'Invalid Token' });
  return jwt.verify(token, jwtSalt, (err, decode) => {
    if (err) return res.status(401).send({ success: false, message: 'Fail to authenticate' });
    req.userId = decode.id;
    return next();
  });
};

export const verifyAdmin = async (req, res, next) => {
  const { userId } = req;
  const data = await db.findById(table, userId);
  if (typeof data !== 'object') return res.status(404).send({ success: false, message: 'Invalid Token' });
  if (data.is_admin !== true) return res.status(403).send({ success: false, message: 'You are not authorized' });
  return next();
};
