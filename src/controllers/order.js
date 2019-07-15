// import * as db from '../database/utilities/db-methods';
import debug from 'debug';
import {
  expectObj, responseData, isEmpty, throwError, getResponseData,
} from '../helper';
import Validator from '../middlewares/validation';
import BaseModel from '../models/model';

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

export const create = async (req, res) => {
  // Get user and body from req Object
  const { user, body } = req;

  // Set allowed feilds
  const fillable = ['car_id', 'price'];
  /**
   * if unexpected fields are post return error message
   * @param unwanted : these are fields that expected but not needed by database
   */
  const { status, message, accepted } = expectObj(body, fillable);
  if (status) return responseData(res, false, 422, message);

  const rules = {
    car_id: ['required', 'is_numeric'],
    price: ['required', 'is_numeric', 'min_length:2'],
  };

  const validate = new Validator();
  validate.make(body, rules);
  const db = new BaseModel('orders');
  try {
    if (validate.fails()) throwError(422, validate.getFirstError());
    const { rows } = await getCarById(body.car_id);
    const [car] = rows;
    /**
       * If the seller try to make purchase of his/her own car ad respond with error
       * If the car ad is not published response with error
       * If the car does not exit respond with error
       */
    const { success, statusCode, errMsg } = errorOccur(user.id, car);
    if (!success) throwError(statusCode, errMsg);


    /**
       * If buyer has already made purchase order for the car ad
       * response to the buyer with purchase already make and
       * it should be updated
       */
    const orderRecord = await db.findByFilter({
      car_id: {
        column: 'car_id', operator: '=', value: accepted.car_id, logic: 'AND',
      },
      buyer: {
        column: 'buyer', operator: '=', value: user.id, logic: 'AND',
      },
      status: {
        column: 'status', operator: '=', value: 'pending', logic: '',
      },
    });
    if (orderRecord.rows.length > 0) throwError(422, 'Purchase order has been made for this car ad by the buyer, try to update the purchase order');

    const payload = {
      ...accepted,
      ...{ status: 'pending' },
      ...{ buyer: user.id },
      ...{ price_offered: body.price },
      ...{ new_price_offered: body.price },
      ...{ old_price_offered: 0 },
    };


    // Save the rest data to database
    const order = await db.save(payload, ['status', 'car_id', 'buyer', 'price', 'price_offered', 'new_price_offered', 'old_price_offered']);
    return responseData(res, true, 201, order);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, orderDebug, 'Error making purchase order');
    return responseData(res, success, code, msg);
  } finally {
    await db.db.end();
  }
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
  const fillable = ['price'];
  /**
   * if unexpected fields are post return error message
   * @param unwanted : these are fields that expected but not needed by database
   */
  const { status, message, accepted } = expectObj(body, fillable);
  if (status) return responseData(res, false, 422, message);

  // Set validation
  const rules = {
    price: ['required', 'is_numeric', 'min_length:2'],
  };

  // Make validation
  const validate = new Validator();
  validate.make(body, rules);

  // Get Order Id
  const orderId = parseInt(params.id, 10);

  // if validation passes
  const db = new BaseModel('orders');
  try {
    if (validate.fails()) throwError(422, validate.getFirstError());
    const { rows } = await db.findById(orderId);
    const [order] = rows;

    updatePriceError(rows, order, user);
    // Update old_price_offered with previous order
    const payload = {
      ...accepted,
      price_offered: body.price,
      old_price_offered: order.price_offered,
      new_price_offered: body.price,
    };

    const orderRecord = await db.updateById(payload, orderId, ['status', 'car_id', 'buyer', 'price', 'price_offered', 'new_price_offered', 'old_price_offered']);
    const [updateOrder] = orderRecord.rows;
    return responseData(res, true, 200, updateOrder);
  } catch (err) {
    const { success, code, msg } = getResponseData(err, orderDebug, 'Error upading purchase order price');
    return responseData(res, success, code, msg);
  } finally {
    await db.db.end();
  }
};
