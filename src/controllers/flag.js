// import * as db from '../database/utilities/db-methods';
import debug from 'debug';
import { expectObj, responseData } from '../helper';
import Validator from '../middlewares/validation';
import BaseModel from '../models/model';

const flagDebug = debug('automart:flag');

export const getFlag = async () => {};

export const create = async (req, res) => {
  // Get body from req
  const { body, user } = req;
  // Expected fields
  const fillable = ['car_id', 'reason', 'description'];
  /**
   * if unexpected fields are post return error message
   * @param unwanted : these are fields that expected but not needed by database
   */
  const { status, message, accepted } = expectObj(body, fillable);

  if (status) return responseData(res, false, 422, message);
  // Set validation rule
  const rules = {
    car_id: ['required', 'is_numeric'],
    reason: ['required', 'min_length:3'],
    description: ['required', 'min_length:10'],
  };

  // Make validation
  const validate = new Validator();
  validate.make(body, rules);

  // if validation passes
  if (validate.passes()) {
    const db = new BaseModel('flags');
    try {
      // console.group('Flag Create');
      // console.log(rules);
      // console.groupEnd();
      // Check if user has flag the car with the same reason
      const flagRecord = await db.findByFilter({
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
      if (flagRecord.rows.length > 0) return responseData(res, false, 422, `You have already flag the car ad with ${accepted.reason} reason`);


      // If the reason of flag is different or has not be flag before save flag
      const payload = {
        ...accepted,
        ...{ user_id: user.id },
      };

      // Save data and return data
      const flag = await db.save(payload, ['car_id', 'user_id', 'reason', 'description']);

      return responseData(res, true, 201, flag);
    } catch (err) {
      flagDebug(err);
      return responseData(res, false, 501, 'Error creating Flag');
    } finally {
      await db.db.end();
    }
  }

  return responseData(res, false, 422, validate.getFirstError());
};
