import jwt from 'jsonwebtoken';
// import * as db from '../database/utilities/db-methods';
import debug from 'debug';
import BaseModel from '../models/model';
import { responseData, isEmpty } from '../helper';

const middlewareDebug = debug('automart:middlewareDebug');

const jwtSalt = process.env.SECRET_KEY || 'test';

export const verifyToken = (req, res, next) => {
  // const authorization = req.headers.Authorization;
  const authorization = req.get('authorization') || req.body.token;

  //   middlewareDebug(authorization);
  if (!/^Bearer\s+/.test(authorization)) return responseData(res, false, 403, 'Not authorized');
  const token = authorization.replace(/^Bearer\s+/, '');
  if (!token) return responseData(res, false, 403, 'Invalid Token');
  return jwt.verify(token, jwtSalt, (err, decode) => {
    if (err) return responseData(res, false, 401, 'Fail to authenticate');
    req.user = decode.user;
    return next();
  });
};


export const verifyAdmin = async (req, res, next) => {
  const { user } = req;
  /**
   * If user is empty or user is not admin
   * then user is either a seller or a buyer
   *  */
  if (isEmpty(user) || !user.is_admin) return next('route');

  return next();
};

export const verifyPublished = async (req, res, next) => {
  const { id } = req.params;

  const carId = parseInt(id, 10);
  const db = new BaseModel('cars');
  try {
    const { rows } = await db.findById(carId);

    const [car] = rows;
    if (isEmpty(car)) return responseData(res, false, 404, 'Car advert not found');
    req.payload = { ...car };
    if (car.published) return next();
    return next('route');
  } catch (e) {
    middlewareDebug(e);
    return responseData(res, false, 500, 'Error Checking User Permission');
  } finally {
    await db.db.end();
  }
};

export const verifySeller = async (req, res, next) => {
  const { payload, user } = req;
  const { owner } = payload;
  // If the car advert is own by user
  if (+owner === +user.id) return next();
  // If user is an admin the redirect to admin authentication
  // else respond with authorized access
  return user.is_admin === true ? next() : responseData(res, false, 403, 'Car advert not allowed to be viewed');
};

export const localPrefix = async (req, res, next) => {
  const { user } = req;
  req.userImageTag = [user.username, 'admin'];
  req.isAdmin = user.is_admin;
  next();
};
