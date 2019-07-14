import supertest from 'supertest';
import assert from 'assert';
import bcrypt from 'bcryptjs';
// import * as db from '../src/database/utilities/db-methods';
import app from '../src/app';
import BaseModel from '../src/models/model';

const request = supertest(app);

const bcryptSalt = +process.env.BCRYPT_SALT;

const password = bcrypt.hashSync('testing', bcrypt.genSaltSync(bcryptSalt));


before(async () => {
  const carDB = new BaseModel('cars');
  try {
    await carDB.execSql('TRUNCATE TABLE public.flags CASCADE');
    await carDB.execSql('ALTER SEQUENCE public.flags_id_seq RESTART WITH 1');
    await carDB.execSql('TRUNCATE TABLE public.orders CASCADE');
    await carDB.execSql('ALTER SEQUENCE public.orders_id_seq RESTART WITH 1');
    await carDB.execSql('TRUNCATE TABLE public.cars CASCADE');
    await carDB.execSql('ALTER SEQUENCE public.cars_id_seq RESTART WITH 1');
    await carDB.execSql('TRUNCATE TABLE public.users CASCADE');
    await carDB.execSql('ALTER SEQUENCE public.users_id_seq RESTART WITH 1');
  } catch (err) {
    console.log(err);
  } finally {
    await carDB.db.end();
  }
});

describe('User Authentication API Routes', () => {
  before(async () => {
    // done();
    const userDB = new BaseModel('users');
    try {
      await userDB.save({
        first_name: 'test 1 first name',
        last_name: 'test 1 last name',
        email: 'test1@automart.com',
        address: 'test 1 home address',
        is_admin: true,
        password,
      });

      await userDB.save({
        first_name: 'test 2 first name',
        last_name: 'test 2 last name',
        email: 'test2@automart.com',
        address: 'test 2 home address',
        is_admin: false,
        password,
      });
    } catch (err) {
      console.log(err);
    } finally {
      await userDB.db.end();
    }
  });

  describe('POST /auth/signup', () => {
    it('create a user', async () => {
      const res = await request.post('/api/v1/auth/signup')
        .send({
          first_name: 'John',
          last_name: 'Smith',
          email: 'johnsmith@gmail.com',
          address: '31, Alagba street orile',
          password: 'johnsmith',
          compare_password: 'johnsmith',
        })
        .set('accept', 'json')
        .expect(201);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('POST /auth/signin', () => {
    it('sign in a user', async () => {
      const res = await request.post('/api/v1/auth/signin')
        .send({
          email: 'test1@automart.com',
          password: 'testing',
        })
        .set('accept', 'json')
        .expect(200);
      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });
});

describe('Car advertisement API Routes', () => {
  let adminToken;
  let sellerToken;
  before(async () => {
    const carDB = new BaseModel('cars');
    try {
      await carDB.save({
        owner: 2,
        manufacturer: 'Toyota',
        model: '4Runner',
        price: 120000,
        state: 'used',
        status: 'available',
        body_type: 'truck',
        published: true,
      });
      await carDB.save({
        owner: 3,
        manufacturer: 'Toyota',
        model: 'Corolla',
        price: 80000,
        state: 'used',
        status: 'available',
        body_type: 'car',
        published: true,
      });
      await carDB.save({
        owner: 3,
        manufacturer: 'Lexus',
        model: 'MX',
        price: 220000,
        state: 'new',
        status: 'available',
        body_type: 'car',
        published: false,
      });
      await carDB.save({
        owner: 2,
        manufacturer: 'Ford',
        model: 'EcoSport',
        price: 150000,
        state: 'used',
        status: 'sold',
        body_type: 'truck',
        published: true,
      });
    } catch (err) {
      console.log(err);
    } finally {
      carDB.db.end();
    }

    // Admin User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test1@automart.com',
        password: 'testing',
      })
      .set('accept', 'json');
    const { data } = res.body;
    adminToken = data.token;

    // User
    const res2 = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'testing',
      })
      .set('accept', 'json');
    sellerToken = res2.body.data.token;
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
          published: false,
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(201);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  /**
   * Admin can view filtered cars created by all sellers
   * Seller can view filtered cars created by them
   * Buyer can view filtered cars published by all sellers
   */
  describe('GET /car?status=available&state=new', () => {
    it('View all car advertisement that are available and new by seller', async () => {
      const res = await request.get('/api/v1/car?status=available&state=new')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 1], [success, data.length]);
    });
  });

  describe('GET /car?status=available&state=used', () => {
    it('View all car advertisement that are available and used by seller', async () => {
      const res = await request.get('/api/v1/car?status=available&state=used')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 1], [success, data.length]);
    });
  });

  describe('GET /car?status=available&manufacturer=ford', () => {
    it('View all car advertisement whose manaufacturer is ford by seller', async () => {
      const res = await request.get('/api/v1/car?status=available&manufacturer=ford')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 1], [success, data.length]);
    });
  });

  describe('GET /car?body_type=car', () => {
    it('View all car advertisement whose body type is car by seller', async () => {
      const res = await request.get('/api/v1/car?body_type=car')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 1], [success, data.length]);
    });
  });

  describe('GET /car?status=available&min_price=120000&max_price=20000000', () => {
    it('View all car advertisement that are available and within the range of 120000 to 20000000 by seller', async () => {
      const res = await request.get('/api/v1/car?status=available&min_price=120000&max_price=20000000')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 2], [success, data.length]);
    });
  });

  /**
   * Admin can view all cars created by all sellers
   * Seller can view all cars created by them
   * Buyer can view all cars published by all sellers
   */

  describe('GET /car', () => {
    it('View all car advertisement by sellers', async () => {
      const res = await request.get('/api/v1/car')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('GET /car', () => {
    it('View all car advertisement by admin', async () => {
      const res = await request.get('/api/v1/car')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('GET /buyer/car', () => {
    it('View all car advertisement by buyers', async () => {
      const res = await request.get('/api/v1/buyer/car')
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
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
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /car/1/price', () => {
    it('Update the price car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/price')
        .send({
          price: 150000,
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /car/2/price', () => {
    it('Update the price car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/price')
        .send({
          price: 100000,
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('PATCH /car/1/status', () => {
    it('Update the status car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/status')
        .send({
          status: 'sold',
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /car/2/status', () => {
    it('Update the status car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/status')
        .send({
          status: 'sold',
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('PATCH /car/1/draft', () => {
    it('Draft car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/draft')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /car/2/draft', () => {
    it('Seller draft car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/draft')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('PATCH /car/1/publish', () => {
    it('Publish car advertisement by the seller', async () => {
      const res = await request.patch('/api/v1/car/1/publish')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /car/2/publish', () => {
    it('Seller publish car advertisement by another seller', async () => {
      const res = await request.patch('/api/v1/car/2/publish')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
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

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('GET /car/5', () => {
    it('View unpublished car advertisement by buyer', async () => {
      const res = await request.get('/api/v1/car/5')
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('GET /car/5', () => {
    it('Seller view car advertisement created by the  seller', async () => {
      const res = await request.get('/api/v1/car/5')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('GET /car/3', () => {
    it('Seller view car advertisement created by the other seller', async () => {
      const res = await request.get('/api/v1/car/3')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('GET /car/5', () => {
    it('Admin view car advertisement created by any seller', async () => {
      const res = await request.get('/api/v1/car/3')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  /**
   * Beginning of deleting car by admin and sellers unit testing
   */

  describe('DELETE /car/5', () => {
    it('Seller delete car advertisement created the seller', async () => {
      const res = await request.delete('/api/v1/car/5')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });

  describe('DELETE /car/2', () => {
    it('Seller delete car advertisement created by other seller', async () => {
      const res = await request.delete('/api/v1/car/2')
        .set('Authorization', `Bearer ${sellerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('DELETE /car/4', () => {
    it('Admin delete car advertisement', async () => {
      const res = await request.delete('/api/v1/car/4')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });
});

describe('Make Purchase Order API', () => {
  let buyerToken;
  let ownerToken;

  before(async () => {
    const orderDB = new BaseModel('orders');
    try {
      await orderDB.save({
        buyer: '1',
        car_id: '1',
        status: 'pending',
        price: '120000',
        price_offered: '100000',
        old_price_offered: '0',
        new_price_offered: '100000',
      });
      await orderDB.save({
        buyer: '2',
        car_id: '2',
        status: 'pending',
        price: '80000',
        price_offered: '70000',
        old_price_offered: '0',
        new_price_offered: '70000',
      });
    } catch (err) {
      console.log(err);
    } finally {
      orderDB.db.end();
    }

    // User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'testing',
      })
      .set('accept', 'json');
    ownerToken = res.body.data.token;

    const res2 = await request.post('/api/v1/auth/signin')
      .send({
        email: 'johnsmith@gmail.com',
        password: 'johnsmith',
      })
      .set('accept', 'json');
    buyerToken = res2.body.data.token;
  });

  describe('POST /order', () => {
    it('Buyer make purchase order', async () => {
      const res = await request.post('/api/v1/order')
        .send({
          price: 75000,
          car_id: 1,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(201);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('POST /order', () => {
    it('Buyer make purchase order of car advert he/she has made before while it is pending', async () => {
      const res = await request.post('/api/v1/order')
        .send({
          price: 75000,
          car_id: 1,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(422);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('POST /order', () => {
    it('Seller cannot make other of the car advert he or she created', async () => {
      const res = await request.post('/api/v1/order')
        .send({
          price: 110000,
          car_id: 1,
        })
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('accept', 'json')
        .expect(401);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
    });
  });

  describe('PATCH /order/3/price', () => {
    it('Buyer updating his or her purchase order', async () => {
      const res = await request.patch('/api/v1/order/3/price')
        .send({
          price: 76000,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });

  describe('PATCH /order/1/price', () => {
    it('Buyer updating purchase order made by another buyer', async () => {
      const res = await request.patch('/api/v1/order/1/price')
        .send({
          price: 115000,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(403);

      const { success, error } = res.body;
      assert.deepStrictEqual([false, 'string'], [success, typeof error]);
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
        password: 'testing',
      })
      .set('accept', 'json');
    buyerToken = res.body.data.token;
  });

  describe('POST /flag', () => {
    it('Buyer flag car AD as fraud', async () => {
      const res = await request.post('/api/v1/flag')
        .send({
          reason: 'pricing',
          car_id: 2,
          description: 'The price of the car AD is very high',
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(201);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });
});


// after(async () => {
//   // await db.drop('orders');
// });
