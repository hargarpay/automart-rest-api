// import * as db from '../database/utilities/db-methods';
import debug from 'debug';
import {
  expectObj, responseData, isEmpty, throwError, getResponseData,
} from '../helper';
import BaseModel from '../models/model';
import { makeValidation } from '../helper/validation';

const orderDebug = debug('automart:order');
// const table = 'orders';

export const getOrder = () => {};

const errorOccur = (userId, car) => {
  if (isEmpty(car)) return { success: false, statusCode: 404, errMsg: 'Record not found' };
  if (+car.owner === +userId) return { success: false, statusCode: 401, errMsg: 'Seller can not make purchase of his/her car advert' };
  if (!car.published) return { success: false, statusCode: 403, errMsg: 'Record not accessible' };
  return { success: true };
};

const getCarById = async (carId) => {
  const dbCar = new BaseModel('cars');
  try {
    const result = await dbCar.findById(carId);
    return result;
  } catch (e) {
    throw new Error(e);
  } finally {
    await dbCar.db.end();
  }
};

const carExistFilterConfig = (accepted, user) => (
  {
    car_id: {
      column: 'car_id', operator: '=', value: accepted.car_id, logic: 'AND',
    },
    buyer: {
      column: 'buyer', operator: '=', value: user.id, logic: 'AND',
    },
    status: {
      column: 'status', operator: '=', value: 'pending', logic: '',
    },
  }
);

const carDataForDB = (accepted, user, body) => {
  const priceOrder = body.price || body.amount;
  return ({
    ...accepted,
    ...{ status: 'pending' },
    ...{ buyer: user.id },
    ...{ price_offered: priceOrder },
    ...{ new_price_offered: priceOrder },
    ...{ old_price_offered: 0 },
  });
};

const carValidationRules = (body) => {
  const ruleProps = isEmpty(body.price) ? 'amount' : 'price';
  return ({
    car_id: ['required', 'is_numeric'],
    [ruleProps]: ['required', 'is_numeric', 'min_length:2'],
  });
};
export const create = async (req, res) => {
  // Get user and body from req Object
  const { user, body } = req;
  const fillable = ['car_id', 'price', 'amount'];
  const { status, message, accepted } = expectObj(body, fillable);
  if (status) return responseData(res, false, 422, message);
  const db = new BaseModel('orders');
  try {
    makeValidation(body, carValidationRules(body));
    const { rows } = await getCarById(body.car_id);
    const [car] = rows;
    const { success, statusCode, errMsg } = errorOccur(user.id, car);
    if (!success) throwError(statusCode, errMsg);

    const orderRecord = await db.findByFilter(carExistFilterConfig(accepted, user));
    if (orderRecord.rows.length > 0) throwError(422, 'Purchase order has been made for this car ad by the buyer, try to update the purchase order');

    const order = await db.save(carDataForDB(accepted, user, body), ['status', 'car_id', 'buyer', 'price', 'price_offered', 'new_price_offered', 'old_price_offered']);
    return responseData(res, true, 201, order);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, orderDebug, 'Error making purchase order');
    return responseData(res, success, code, msg);
  } finally { await db.db.end(); }
};


const carUpdatePriceForDB = (accepted, body, order) => {
  const mainPrice = body.amount || body.price;
  return ({
    ...accepted,
    price_offered: mainPrice,
    old_price_offered: order.price_offered,
    new_price_offered: mainPrice,
  });
};

const updatePriceError = (rows, order, user) => {
  // If order does not exist response with order not found
  if (rows.length === 0) throwError(404, 'Order not found');
  // A buyer can only update his/her purchase order when it is still pending
  if (order.status !== 'pending') throwError(403, 'Permission not allowed as the purchase order is no longer pending');

  // A buyer can only updated his/her own purchase order
  if (order.buyer !== user.id) throwError(403, 'Buyer not authorized');
};

export const updatePrice = async (req, res) => {
  // Get params, body and user from req Object
  const { params, body, user } = req;

  // Allowed fields
  const fillable = ['price', 'amount'];
  const { status, message, accepted } = expectObj(body, fillable);
  if (status) return responseData(res, false, 422, message);

  // Get Order Id
  const orderId = parseInt(params.id, 10);

  // if validation passes
  const db = new BaseModel('orders');
  try {
    const ruleProps = isEmpty(body.price) ? 'amount' : 'price';
    makeValidation(body, { [ruleProps]: ['required', 'is_numeric', 'min_length:2'] });

    const { rows } = await db.findById(orderId);
    const [order] = rows;

    updatePriceError(rows, order, user);

    const orderRecord = await db.updateById(carUpdatePriceForDB(accepted, body, order), orderId, ['status', 'car_id', 'buyer', 'price', 'price_offered', 'new_price_offered', 'old_price_offered']);
    const [updateOrder] = orderRecord.rows;
    return responseData(res, true, 200, updateOrder);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, orderDebug, 'Error upading purchase order price');
    return responseData(res, success, code, msg);
  } finally {
    await db.db.end();
  }
};
