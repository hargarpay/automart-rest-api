// import debug from 'debug';
import * as db from '../database/utilities/db-methods';

// const carDebug = debug('automart:car');
const table = 'cars';

export const getCar = async () => {};

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
    return {
      key: column,
      value: query[column],
      operation,
    };
  });
};

const getRecords = async filter => (
  filter.length > 0 ? db.findByFilter(table, filter) : db.findAll(table)
);

export const getCars = async (req, res) => {
  let records = [];
  let filter = filterQuery(req);

  filter = filter.concat({
    key: 'owner',
    value: req.userId,
    operation: 'eq',
  });

  records = await getRecords(filter);

  res.status(200).send({
    success: true,
    payload: records,
  });
};

export const getCarsByAdmin = async (req, res) => {
  let records = [];
  const filter = filterQuery(req);

  records = await getRecords(filter);

  res.status(200).send({
    success: true,
    payload: records,
  });
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
