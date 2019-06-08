import * as db from '../database/utilities/db-methods';

const table = 'orders';

export const getOrder = () => {};

export const create = async (req, res) => {
  try {
    const { userId, body } = req;
    const createdOn = new Date();
    const car = await db.findById('cars', body.car_id);

    if (!car) return res.status(404).send({ success: false, message: 'Record not found' });
    if (+car.owner === +userId) return res.status(401).send({ success: false, message: 'Seller can not make purchase of his car advert' });
    if (!car.published) return res.status(403).send({ success: false, message: 'Record not accessible' });
    const payload = {
      ...body,
      ...{ status: 'pending' },
      ...{ created_on: createdOn },
      ...{ buyer: userId },
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
        message: 'Error creating order',
      });
  }
};
