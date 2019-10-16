// import * as db from '../database/utilities/db-methods';
import debug from 'debug';
import {
  expectObj, responseData, throwError, getResponseData,
} from '../helper';
import BaseModel from '../models/model';
import { makeValidation } from '../helper/validation';

const flagDebug = debug('automart:flag');

export const getFlag = async () => {};

const flagExistFilterConfig = (accepted, user) => ({
  user_id: {
    column: 'user_id', operator: '=', value: user.id, logic: 'AND',
  },
  car_id: {
    column: 'car_id', operator: '=', value: accepted.car_id, logic: 'AND',
  },
  reason: {
    column: 'reason', operator: '=', value: accepted.reason, logic: '',
  },
});

const flagValidationRule = () => ({
  car_id: ['required', 'is_numeric'],
  reason: ['required', 'min_length:3'],
  description: ['required', 'min_length:10'],
});

const flagPayload = (accepted, user) => ({
  ...accepted,
  ...{ user_id: user.id },
});

export const create = async (req, res) => {
  // Get body from req
  const { body, user } = req;
  // Expected fields
  const fillable = ['car_id', 'reason', 'description'];
  const { status, message, accepted } = expectObj(body, fillable);

  if (status) return responseData(res, false, 422, message);

  // if validation passes
  const db = new BaseModel('flags');
  try {
    makeValidation(body, flagValidationRule());
    // Check if user has flag the car with the same reason
    const flagRecord = await db.findByFilter(flagExistFilterConfig(accepted, user));
    if (flagRecord.rows.length > 0) throwError(422, `You have already flag the car ad with ${accepted.reason} reason`);

    // Save data and return data
    const flag = await db.save(flagPayload(accepted, user), ['car_id', 'user_id', 'reason', 'description']);

    return responseData(res, true, 201, flag);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, flagDebug, 'Error creating flag');
    return responseData(res, success, code, msg);
  } finally { await db.db.end(); }
};
