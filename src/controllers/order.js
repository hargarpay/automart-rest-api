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

export const updatePrice = async (req, res) => {
  try {
    const { params, body, userId } = req;
    const orderId = parseInt(params.id, 10);
    const order = await db.findById(table, orderId);

    if (order.buyer !== userId) return res.status(403).send({ success: false, message: 'Buyer not authorized' });

    const payload = {
      price_offered: body.price_offered,
      old_price_offered: order.price_offered,
      new_price_offered: body.price_offered,
    };
    const record = await db.update(table, payload, orderId);
    return res.status(200).send({
      success: true,
      payload: record,
    });
  } catch (err) {
    return res.status(501)
      .send({
        success: false,
        message: 'Error updating order price',
      });
  }
};
