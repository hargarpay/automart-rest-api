import debug from 'debug';
// import * as db from '../database/utilities/db-methods';
import {
  isEmpty, responseData, expectObj, throwError, getResponseData,
} from '../helper';
import BaseModel from '../models/model';
import { makeValidation } from '../helper/validation';

const carDebug = debug('automart:car');
// const table = 'cars';

export const getCar = async (req, res) => {
  const { payload } = req;

  return responseData(res, true, 200, payload);
};

const filterQuery = (req) => {
  const { query, user } = req;
  const filters = {};
  const queryFeilds = {
    status: { column: 'status', operator: '=' },
    max_price: { column: 'price', operator: '<=' },
    min_price: { column: 'price', operator: '>=' },
    state: { column: 'state', operator: '=' },
    manufacturer: { column: 'manufacturer', operator: 'ILIKE' },
    model: { column: 'model', operator: 'ILIKE' },
    body_type: { column: 'body_type', operator: '=' },
  };

  const queryKeys = Object.keys(query);
  const zeroIndexLegth = queryKeys.length - 1;
  queryKeys.forEach((field, index) => {
    const eachField = queryFeilds[field];
    if (!isEmpty(eachField)) {
      const value = ['LIKE', 'ILIKE'].includes(eachField.operator) ? `%${query[field]}%` : query[field];
      const logic = zeroIndexLegth === index && user.is_admin ? '' : 'AND';
      filters[field] = { ...eachField, ...{ value, logic } };
    }
  });
  return filters;
};

const getRecords = async (filters) => {
  const db = new BaseModel('cars');
  try {
    const { rows } = Object.keys(filters).length > 0
      ? await db.findByFilter(filters)
      : await db.findAll();
    return ({ code: 200, success: true, payload: rows });
  } catch (error) {
    carDebug(error);
    return ({ code: 500, success: false, payload: 'Error fetching cars' });
  } finally {
    await db.db.end();
  }
};

export const getCarsBySeller = async (req, res) => {
  const filters = filterQuery(req);
  const { user } = req;

  const updateFilters = {
    ...filters,
    ...{
      owner: {
        column: 'owner', operator: '=', value: user.id, logic: '',
      },
    },
  };

  const { code, success, payload } = await getRecords(updateFilters);
  return responseData(res, success, code, payload);
};

export const getCarsByBuyer = async (req, res) => {
  const filters = filterQuery(req);
  const updateFilters = {
    ...filters,
    ...{
      owner: {
        column: 'published', operator: '=', value: true, logic: '',
      },
    },
  };

  const { code, success, payload } = await getRecords(updateFilters);
  return responseData(res, success, code, payload);
};

export const getCarsByAdmin = async (req, res) => {
  // Prepare query parameter for filtering
  const filters = filterQuery(req);

  const { code, success, payload } = await getRecords(filters);
  return responseData(res, success, code, payload);
};

const carInputValidationRules = () => (
  {
    state: ['required', 'enum:new,used'],
    price: ['required', 'is_number'],
    manufacturer: ['required', 'min_length:2'],
    model: ['required', 'min_length:2'],
    body_type: ['required', 'min_length:2'],
    published: ['required_if_not_empty', 'is_boolean'],
  }
);

const carExistFilterConfig = (accepted, user) => ({
  manufacturer: {
    column: 'manufacturer', operator: '=', value: accepted.manufacturer, logic: 'AND',
  },
  model: {
    column: 'model', operator: '=', value: accepted.model, logic: 'AND',
  },
  body_type: {
    column: 'body_type', operator: '=', value: accepted.body_type, logic: 'AND',
  },
  owner: {
    column: 'owner', operator: '=', value: user.id, logic: '',
  },
});

const carDataForDB = (accepted, user) => (
  { ...accepted, ...{ status: 'available' }, ...{ owner: `${user.id}` } }
);

const carFillableField = () => ([
  'state', 'manufacturer', 'price', 'model', 'body_type', 'published', 'status',
  'year', 'fuel_type', 'fuel_cap', 'transmission_type', 'mileage', 'color',
  'description', 'doors', 'ac', 'tinted_windows', 'arm_rest', 'air_bag', 'fm_radio', 'dvd_player',
  'img_url',
]);

export const create = async (req, res) => {
  // Get body parameter from req
  const { body, user } = req;
  // List accepted feilds
  // Check if all feilds are allowed, Remove fields that are not for database but allowed
  const { status, message, accepted } = (expectObj(body, carFillableField()));
  console.log(message);
  if (status) return responseData(res, false, 422, message);
  // Check Validation
  const db = new BaseModel('cars');
  try {
    makeValidation(body, carInputValidationRules());
    // Check if the data has been save in in database before
    const record = await db.findByFilter(carExistFilterConfig(accepted, user));
    console.log(record.rows.length);
    if (record.rows.length > 0) throwError(422, `Car with ${accepted.model} model, ${accepted.manufacturer} manufacturer, ${accepted.body_type} body type and has already been created by seller`);
    // Store data to database and get the ID
    const returnCarProps = carFillableField().concat(['owner']);
    const car = await db.save(carDataForDB(accepted, user), returnCarProps);
    return responseData(res, true, 201, car);
  } catch (error) {
    const { success, code, msg } = getResponseData(error, carDebug, 'Error creating car');
    console.log(msg);
    return responseData(res, success, code, msg);
  } finally { await db.db.end(); }
};

const authorizedValidation = (carRecord, user) => {
  try {
    // If does not exist return not found message else continue process
    if (carRecord.rows.length === 0) return { success: false, code: 404, errMsg: 'Car not found' };
    /*
    * if the car is not own by the user or the user is an admin
    * return authorized message
    */
    const [car] = carRecord.rows;
    if (car.owner !== user.id && !user.is_admin) {
      return { success: false, code: 403, errMsg: 'You are not authorized to perform this action' };
    }

    return { success: true };
  } catch (error) {
    throw new Error(error);
  }
};

const updateField = async (req, options) => {
  // Get params and body from req
  const { params, body, user } = req;
  const { fillable, rules, errorMessage } = options;

  const carId = parseInt(params.id, 10);

  // Check if there not allowed field the return message with allowed fields
  // Among the fields that allowed remove fields that will not be save in the database
  const { status, message, accepted } = (expectObj(body, fillable));
  if (status) {
    // if there are invalid fields return error with feilds allowed
    return { success: false, code: 422, payload: message };
  }

  const db = new BaseModel('cars');
  try {
    makeValidation(body, rules);
    // Check if the car id exist
    const carRecord = await db.findById(carId);
    // If user is authorized
    const { success, code, errMsg } = authorizedValidation(carRecord, user);
    if (!success) throwError(code, errMsg);
    // Update data by Id
    const returnCarProps = carFillableField().concat(['owner']);
    const { rows } = await db.updateById(accepted, carId, returnCarProps);
    const [updateCar] = rows;

    // Update the data and response with successful message
    return { success: true, code: 200, payload: updateCar };
    // }
    // If validation fails return with validation error message
    // return { success: false, code: 422, payload: validate.getFirstError() };
  } catch (error) {
    const { success, code, msg } = getResponseData(error, carDebug, errorMessage);
    return { success, code, payload: msg };
  } finally {
    await db.db.end();
  }
};

export const update = async (req, res) => {
  // List of fields allowed
  const fillable = carFillableField();
  // Set Validation Rules
  const rules = {
    state: ['required', 'enum:new,used'],
    price: ['required', 'is_number'],
    manufacturer: ['required', 'min_length:2'],
    model: ['required', 'min_length:2'],
    body_type: ['required', 'min_length:2'],
  };
  const errorMessage = 'Error Updating car';

  const options = { fillable, rules, errorMessage };
  const { success, code, payload } = await updateField(req, options);
  return responseData(res, success, code, payload);
};

export const updatePrice = async (req, res) => {
  // List of fields allowed
  const fillable = ['price'];
  // Set Validation Rules
  const rules = {
    price: ['required', 'is_number', 'min_length:2'],
  };
  const errorMessage = 'Error Updating car price';

  const options = { fillable, rules, errorMessage };
  const { success, code, payload } = await updateField(req, options);
  return responseData(res, success, code, payload);
};

export const updateStatus = async (req, res) => {
  // List of fields allowed
  const fillable = ['status'];
  // Set Validation Rules
  const rules = {
    status: ['required', 'enum:available,sold'],
  };
  const errorMessage = 'Error Updating car status';

  const options = { fillable, rules, errorMessage };
  const { success, code, payload } = await updateField(req, options);
  return responseData(res, success, code, payload);
};

export const publish = async (req, res) => {
  req.body = { published: true };
  // List of fields allowed
  const fillable = ['published'];
  // Set Validation Rules
  const rules = {};
  const errorMessage = 'Error publishing car';

  const options = { fillable, rules, errorMessage };
  const { success, code, payload } = await updateField(req, options);
  return responseData(res, success, code, payload);
};

export const draft = async (req, res) => {
  req.body = { published: false };
  // List of fields allowed
  const fillable = ['published'];
  // Set Validation Rules
  const rules = {};
  const errorMessage = 'Error drafting car';

  const options = { fillable, rules, errorMessage };
  const { success, code, payload } = await updateField(req, options);
  return responseData(res, success, code, payload);
};

export const remove = async (req, res) => {
  // Get the car id
  const { params, user } = req;
  const carId = parseInt(params.id, 10);

  const db = new BaseModel('cars');
  try {
    // Check if the car id exist
    const carRecord = await db.findById(carId);
    // If user is authorized
    const { success, code, errMsg } = authorizedValidation(carRecord, user);
    if (!success) return responseData(res, success, code, errMsg);

    const result = await db.removeById(carId);
    carDebug(result);
    return responseData(res, true, 200, 'Car Ad successfully deleted');
  } catch (err) {
    carDebug(err);
    return responseData(res, false, 500, 'Error delete car ad');
  } finally {
    await db.db.end();
  }
};
