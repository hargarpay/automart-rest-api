/* eslint-disable no-throw-literal */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import BaseModel from '../models/model';
import {
  expectObj, responseData, throwError, getResponseData,
} from '../helper';
import { uniqueData } from '../helper/model';
import { makeValidation } from '../helper/validation';

const bcryptSalt = +process.env.BCRYPT_SALT;
const jwtSalt = process.env.SECRET_KEY || 'test';


const userDebug = debug('automart:user');

const userValidationRule = () => ({
  first_name: ['required', 'min_length:3'],
  last_name: ['required', 'min_length:3'],
  email: ['required', 'email'],
  address: ['required', 'min_length:10'],
  password: ['required', 'min_length:6', 'compare:compare_password'],
});

export const register = async (req, res) => {
  // Get the body data from req
  const { body } = req;
  // Allowed fields to be posted
  const fillable = ['first_name', 'last_name', 'email', 'address', 'password', 'compare_password'];

  const { status, message, accepted } = (expectObj(body, fillable, ['compare_password']));
  if (status) return responseData(res, false, 422, message);

  const db = new BaseModel('users');
  try {
    makeValidation(body, userValidationRule());
    // Check if email is unique
    const result = await uniqueData(accepted.email, ['users', 'email']);

    // If email is not unique send message
    if (result.status) throwError(422, result.message);

    // Hash password
    const hashPassword = bcrypt.hashSync(body.password, bcrypt.genSaltSync(bcryptSalt));

    // Prepare valid and expected data for sql
    const payload = { ...accepted, ...{ password: hashPassword, is_admin: false } };

    // Save data
    const user = await db.save(payload, ['first_name', 'last_name', 'email', 'is_admin', 'address']);

    // Generate token
    const token = jwt.sign({ user }, jwtSalt, { expiresIn: 43200 });

    // Add token to the user data
    const newPayload = { ...user, ...{ token } };
    // Send successful response
    return responseData(res, true, 201, newPayload);
  } catch (error) {
    const { success, code, msg } = getResponseData(error, userDebug, 'There was an error creating user');
    return responseData(res, success, code, msg);
  } finally {
    await db.db.end();
  }
  // If the validation do not pass reponse with error
};

export const login = async (req, res) => {
  // Get the body data from req
  const { body } = req;
  const fillable = ['email', 'password'];
  const { status, message, accepted } = (expectObj(body, fillable, []));
  if (status) return responseData(res, false, 422, message);

  // Set validation rules
  const rules = { email: ['required', 'email'], password: ['required', 'min_length:6'] };
  const db = new BaseModel('users');
  try {
    makeValidation(body, rules);
    const { rows } = await db.findByFilter({
      email: {
        column: 'email', value: accepted.email, operator: '=', logic: '',
      },
    });
    // If user does not exist response with error;
    if (rows.length === 0) throwError(404, 'Email not found in database');
    const [user] = rows;

    // Check if user password is correct
    if (!bcrypt.compareSync(accepted.password, user.password)) throwError(422, 'Credential is invalid');

    // Generate token and add it to data
    const token = jwt.sign({ user }, jwtSalt, { expiresIn: 43200 });
    const payload = { ...user, ...{ token } };

    // Remove the password from the data and send back data
    delete payload.password;
    return responseData(res, true, 200, payload);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, userDebug, 'Authentication Fail');
    return responseData(res, success, code, msg);
  } finally { await db.db.end(); }
};
