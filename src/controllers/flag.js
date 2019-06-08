import * as db from '../database/utilities/db-methods';

const table = 'flags';

export const getFlag = async () => {};

export const create = async (req, res) => {
  try {
    const { userId, body } = req;
    const createdOn = new Date();
    const payload = {
      ...body,
      ...{ created_on: createdOn },
      ...{ user_id: userId },
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
        message: 'Error creating Flag',
      });
  }
};
