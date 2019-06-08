import supertest from 'supertest';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import * as db from '../src/database/utilities/db-methods';
import app from '../server';

const request = supertest(app);

const bcryptSalt = +process.env.BCRYPT_SALT;

before(async () => {
  await db.clear('users');
  await db.clear('cars');
  await db.clear('orders');
});

describe('User Authentication API Routes', () => {
  before(async () => {
    await db.saveMany('users', [
      {
        first_name: 'test 1 first name',
        last_name: 'test 1 last name',
        email: 'test1@automart.com',
        address: 'test 1 home address',
        username: 'test1',
        is_admin: true,
        password: bcrypt.hashSync('secret', bcrypt.genSaltSync(bcryptSalt)),
      },
      {
        first_name: 'test 2 first name',
        last_name: 'test 2 last name',
        email: 'test2@automart.com',
        address: 'test 2 home address',
        username: 'test2',
        is_admin: false,
        password: bcrypt.hashSync('secret', bcrypt.genSaltSync(bcryptSalt)),
      },
    ]);
    // done();
  });

  describe('POST /auth/signup', () => {
    it('create a user', async () => {
      const res = await request.post('/api/v1/auth/signup')
        .send({
          first_name: 'John',
          last_name: 'Smith',
          email: 'johnsmith@gmail.com',
          address: '31, Alagba street orile',
          username: 'johnsmith',
          password: 'john',
        })
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('POST /auth/signin', () => {
    it('sign in a user', async () => {
      const res = await request.post('/api/v1/auth/signin')
        .send({
          email: 'test1@automart.com',
          password: 'secret',
        })
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });
});

describe('Car advertisement API Routes', () => {
  let adminToken;
  let sellerToken;
  before(async () => {
    await db.saveMany('cars',
      [
        {
          owner: 2,
          created_on: new Date(),
          manufacturer: 'Toyota',
          model: '4Runner',
          price: 120000,
          state: 'used',
          status: 'available',
          body_type: 'truck',
          published: true,
        },
        {
          owner: 3,
          created_on: new Date(),
          manufacturer: 'Toyota',
          model: 'Corolla',
          price: 80000,
          state: 'used',
          status: 'available',
          body_type: 'car',
          published: true,
        },
        {
          owner: 3,
          created_on: new Date(),
          manufacturer: 'Lexus',
          model: 'MX',
          price: 220000,
          state: 'new',
          status: 'available',
          body_type: 'car',
          published: false,
        },
        {
          owner: 2,
          created_on: new Date(),
          manufacturer: 'Ford',
          model: 'EcoSport',
          price: 150000.50,
          state: 'used',
          status: 'sold',
          body_type: 'truck',
          published: true,
        },
      ]);

    // Admin User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test1@automart.com',
        password: 'secret',
      })
      .set('accept', 'json');
    const { payload } = res.body;
    adminToken = payload.token;

    // User
    const res2 = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'secret',
      })
      .set('accept', 'json');
    sellerToken = res2.body.payload.token;
  });

  describe('POST /car', () => {
    it('Create car advertisement', async () => {
      const res = await request.post('/api/v1/car')
        .send({
          manufacturer: 'Ford',
          model: 'Expedition',
          price: 18000000,
          state: 'new',
          body_type: 'car',
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  /**
   * Admin can view filtered cars created by all sellers
   * Seller can view filtered cars created by them
   * Buyer can view filtered cars published by all sellers
   */
  describe('GET /cars?status=available&state=new', () => {
    it('View all car advertisement that are available and new by admin', async () => {
      const res = await request.get('/api/v1/cars?status=available&state=new')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 2], [success, payload.length]);
    });
  });

  describe('GET /cars?status=available&state=used', () => {
    it('View all car advertisement that are available and used by admin', async () => {
      const res = await request.get('/api/v1/cars?status=available&state=used')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 2], [success, payload.length]);
    });
  });

  describe('GET /cars?status=available&manufacturer=ford', () => {
    it('View all car advertisement whose manaufacturer is ford by admin', async () => {
      const res = await request.get('/api/v1/cars?status=available&manufacturer=ford')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 1], [success, payload.length]);
    });
  });

  describe('GET /cars?body_type=car', () => {
    it('View all car advertisement whose body type is car by admin', async () => {
      const res = await request.get('/api/v1/cars?body_type=car')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 3], [success, payload.length]);
    });
  });

  describe('GET /cars?status=available&min_price=120000&max_price=20000000', () => {
    it('View all car advertisement that are available and within the range of 120000 to 20000000 by admin', async () => {
      const res = await request.get('/api/v1/cars?status=available&min_price=120000&max_price=20000000')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 3], [success, payload.length]);
    });
  });

  /**
   * Admin can view all cars created by all sellers
   * Seller can view all cars created by them
   * Buyer can view all cars published by all sellers
   */

  describe('GET /cars', () => {
    it('View all car advertisement by admin', async () => {
      const res = await request.get('/api/v1/cars')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('GET /seller/cars', () => {
    it('View all car advertisement by sellers', async () => {
      const res = await request.get('/api/v1/seller/cars')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('GET /buyer/cars', () => {
    it('View all car advertisement by buyers', async () => {
      const res = await request.get('/api/v1/buyer/cars')
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PUT /car/1', () => {
    it('Update car advertisement with id 1', async () => {
      const res = await request.put('/api/v1/car/1')
        .send({
          manufacturer: 'Ford',
          model: 'Expedition Max',
          price: 15000000,
          state: 'used',
          body_type: 'car',
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /car/1/price', () => {
    it('Update the price car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/price')
        .send({
          price: 150000,
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /car/2/price', () => {
    it('Update the price car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/price')
        .send({
          price: 100000,
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('PATCH /car/1/status', () => {
    it('Update the status car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/status')
        .send({
          status: 'sold',
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /car/2/status', () => {
    it('Update the status car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/status')
        .send({
          status: 'sold',
        })
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('PATCH /car/1/draft', () => {
    it('Draft car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/draft')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /car/2/draft', () => {
    it('Seller draft car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/draft')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('PATCH /car/1/publish', () => {
    it('Publish car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/publish')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /car/2/publish', () => {
    it('Seller publish car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/publish')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  /**
   * Buyer can only view specific published car advert
   * Seller can view specific car created by themselves
   * Admin can view specific car advert created by any seller
   */

  describe('GET /car/1', () => {
    it('View published car advertisement by a buyer', async () => {
      const res = await request.get('/api/v1/car/1')
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('GET /car/5', () => {
    it('View unpublished car advertisement by buyer', async () => {
      const res = await request.get('/api/v1/car/5')
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('GET /car/5', () => {
    it('Seller view car advertisement created by the  seller', async () => {
      const res = await request.get('/api/v1/car/5')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('GET /car/3', () => {
    it('Seller view car advertisement created by the other seller', async () => {
      const res = await request.get('/api/v1/car/3')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('GET /car/5', () => {
    it('Admin view car advertisement created by any seller', async () => {
      const res = await request.get('/api/v1/car/3')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  /**
   * Beginning of deleting car by admin and sellers unit testing
   */

  describe('DELETE /car/5', () => {
    it('Seller delete car advertisement created the seller', async () => {
      const res = await request.delete('/api/v1/car/5')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('DELETE /car/2', () => {
    it('Seller delete car advertisement created by other seller', async () => {
      const res = await request.delete('/api/v1/car/2')
        .set('x-access-token', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('DELETE /car/4', () => {
    it('Admin delete car advertisement', async () => {
      const res = await request.delete('/api/v1/car/4')
        .set('x-access-token', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });
});

describe('Make Purchase Order API', () => {
  let buyerToken;
  before(async () => {
    await db.saveMany('orders', [
      {
        buyer: 1,
        car_id: 1,
        created_on: new Date(),
        status: 'pending',
        price: 120000,
        price_offered: 100000,
      },
      {
        buyer: 2,
        car_id: 2,
        created_on: new Date(),
        status: 'pending',
        price: 80000,
        price_offered: 70000,
      },
    ]);

    // User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'secret',
      })
      .set('accept', 'json');
    buyerToken = res.body.payload.token;
  });

  describe('POST /order', () => {
    it('Buyer make purchase order', async () => {
      const res = await request.post('/api/v1/order')
        .send({
          price_offered: 75000,
          car_id: 2,
        })
        .set('x-access-token', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('POST /order', () => {
    it('Seller cannot make other of the car advert he or she created', async () => {
      const res = await request.post('/api/v1/order')
        .send({
          price_offered: 110000,
          car_id: 1,
        })
        .set('x-access-token', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(401);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });

  describe('PATCH /order/3/price', () => {
    it('Buyer updating his or her purchase order', async () => {
      const res = await request.patch('/api/v1/order/3/price')
        .send({
          price_offered: 76000,
        })
        .set('x-access-token', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });

  describe('PATCH /order/1/price', () => {
    it('Buyer updating purchase order made by another buyer', async () => {
      const res = await request.patch('/api/v1/order/1/price')
        .send({
          price_offered: 115000,
        })
        .set('x-access-token', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, message } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof message]);
    });
  });
});

describe('Flag car advertisement API', () => {
  let buyerToken;
  before(async () => {
    // User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'secret',
      })
      .set('accept', 'json');
    buyerToken = res.body.payload.token;
  });

  describe('POST /flag', () => {
    it('Buyer flag car AD as fraud', async () => {
      const res = await request.post('/api/v1/flag')
        .send({
          reason: 'pricing',
          car_id: 2,
          description: 'The price of the car AD is very high',
        })
        .set('x-access-token', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });
});


after(async () => {
  await db.drop('cars');
  await db.drop('users');
  // await db.drop('orders');
});
