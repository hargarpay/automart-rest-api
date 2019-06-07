// import debug from 'debug';
import * as db from '../database/utilities/db-methods';

// const carDebug = debug('automart:car');
const table = 'cars';

export const getCars = async () => {};

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
