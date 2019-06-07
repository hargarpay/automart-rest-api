// import debug from 'debug';
import * as db from '../database/utilities/db-methods';

// const carDebug = debug('automart:car');
const table = 'cars';

export const getCar = async (req, res) => {
  const { payload } = req;

  return res.status(200)
    .send({
      success: true,
      payload,
    });
};

const filterQuery = (req) => {
  const { query } = req;
  const queryFeilds = {
    status: ['eq', 'status'],
    max_price: ['lte', 'price'],
    min_price: ['gte', 'price'],
    state: ['eq', 'state'],
    manufacturer: ['contain', 'manufacturer'],
    body_type: ['eq', 'body_type'],
  };

  return Object.keys(query).map((field) => {
    const eachField = queryFeilds[field];
    const [operation, column] = eachField;
    return ({
      key: column,
      value: query[field],
      operation,
    });
  });
};

const getRecords = async (filter) => {
  const records = filter.length > 0
    ? await db.findByFilter(table, filter)
    : await db.findAll(table);
  return ({
    success: true,
    payload: records,
  });
};

export const getCarsBySeller = async (req, res) => {
  let filter = filterQuery(req);

  filter = filter.concat({
    key: 'owner',
    value: req.userId,
    operation: 'eq',
  });

  const response = await getRecords(filter);

  res.status(200).send(response);
};

export const getCarsByBuyer = async (req, res) => {
  let filter = filterQuery(req);

  filter = filter.concat({
    key: 'published',
    value: true,
    operation: 'eq',
  });

  const response = await getRecords(filter);

  res.status(200).send(response);
};

export const getCarsByAdmin = async (req, res) => {
  const filter = filterQuery(req);

  const response = await getRecords(filter);

  res.status(200).send(response);
};

export const create = async (req, res) => {
  // await db.clear(table);
  try {
    const { userId, body } = req;
    const createdOn = new Date();
    const payload = {
      ...body,
      ...{ created_on: createdOn },
      ...{ status: 'available' },
      ...{ owner: userId },
      ...{ published: false },
    };
    const record = await db.save(table, payload);
    return res.status(200).send({
      success: true,
      payload: record,
    });
  } catch (err) {
    return res.status(501)
      .send({
        success: false,
        message: 'Error creating car',
      });
  }
};

export const update = async (req, res) => {
  try {
    const { params, body } = req;
    const carId = parseInt(params.id, 10);
    const payload = { ...body };
    const record = await db.update(table, payload, carId);
    return res.status(200).send({
      success: true,
      payload: record,
    });
  } catch (err) {
    return res.status(501)
      .send({
        sucess: false,
        message: 'Error updating car',
      });
  }
};

export const remove = async (req, res) => {
  try {
    const { params } = req;
    const carId = parseInt(params.id, 10);
    const user = await db.findById('users', req.userId);
    const car = await db.findById('cars', carId);

    if (user.id !== car.owner && !user.is_admin) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to perform this action',
      });
    }
    await db.remove(table, +req.params.id);
    return res.status(200).send({
      success: true,
      payload: {
        message: 'Successfully delete car advertisement',
      },
    });
  } catch (err) {
    return res.status(501)
      .send({
        sucess: false,
        message: 'Error updating car',
      });
  }
};
