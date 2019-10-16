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
        street: 'test 1 street',
        city: 'test 1 city',
        state: 'test 1 state',
        country: 'Nigeria',
        phone: '09088776655',
        zip: '101-242',
      });

      await userDB.save({
        first_name: 'test 2 first name',
        last_name: 'test 2 last name',
        email: 'test2@automart.com',
        address: 'test 2 home address',
        is_admin: false,
        password,
        street: 'test 2 street',
        city: 'test 2 city',
        state: 'test 2 state',
        country: 'Nigeria',
        phone: '09088776644',
        zip: '101-242',
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
          street: 'test 3 street',
          city: 'test 3 city',
          state: 'test 3 state',
          country: 'Nigeria',
          phone: '09088776633',
          zip: '101-242',
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
        year: 2000,
        fuel_type: 'Petrol',
        fuel_cap: 300,
        transmission_type: 'Automatic',
        mileage: 3400,
        color: 'Red',
        description: 'Other stories about the car goes here',
        doors: 4,
        ac: true,
        tinted_windows: true,
        arm_rest: false,
        air_bag: false,
        fm_radio: true,
        dvd_player: false,
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
        year: 2003,
        fuel_type: 'Petrol',
        fuel_cap: 2000,
        transmission_type: 'Automatic',
        mileage: 3400,
        color: 'Red',
        description: 'Other stories about the car goes here',
        doors: 4,
        ac: true,
        tinted_windows: true,
        arm_rest: false,
        air_bag: false,
        fm_radio: true,
        dvd_player: false,
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
        year: 2003,
        fuel_type: 'Petrol',
        fuel_cap: 2000,
        transmission_type: 'Automatic',
        mileage: 3400,
        color: 'Red',
        description: 'Other stories about the car goes here',
        doors: 6,
        ac: true,
        tinted_windows: true,
        arm_rest: false,
        air_bag: false,
        fm_radio: true,
        dvd_player: false,
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
        year: 2005,
        fuel_type: 'Petrol',
        fuel_cap: 2000,
        transmission_type: 'Automatic',
        mileage: 3400,
        color: 'Red',
        description: 'Other stories about the car goes here',
        doors: 6,
        ac: true,
        tinted_windows: true,
        arm_rest: false,
        air_bag: false,
        fm_radio: true,
        dvd_player: false,
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
          year: 2003,
          fuel_type: 'Petrol',
          fuel_cap: 2010,
          transmission_type: 'Manual',
          mileage: 3400,
          color: 'Black',
          description: 'Other stories about the car goes here',
          doors: 6,
          ac: true,
          tinted_windows: true,
          arm_rest: false,
          air_bag: false,
          fm_radio: true,
          dvd_player: false,
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
  // let ownerToken;

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
    // const res = await request.post('/api/v1/auth/signin')
    //   .send({
    //     email: 'test2@automart.com',
    //     password: 'testing',
    //   })
    //   .set('accept', 'json');
    // ownerToken = res.body.data.token;

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

  // describe('POST /order', () => {
  //   it(
  // 'Buyer make purchase order of car advert he/she has made before while it is pending',
  //  async () => {
  //     const res = await request.post('/api/v1/order')
  //       .send({
  //         price: 75000,
  //         car_id: 1,
  //       })
  //       .set('Authorization', `Bearer ${buyerToken}`)
  //       .set('accept', 'json')
  //       .expect(422);

  //     const { success, error } = res.body;
  //     assert.deepStrictEqual([false, 'string'], [success, typeof error]);
  //   });
  // });

  // describe('POST /order', () => {
  //   it('Seller cannot make other of the car advert he or she created',
  //  async () => {
  //     const res = await request.post('/api/v1/order')
  //       .send({
  //         price: 110000,
  //         car_id: 1,
  //       })
  //       .set('Authorization', `Bearer ${ownerToken}`)
  //       .set('accept', 'json')
  //       .expect(401);

  //     const { success, error } = res.body;
  //     assert.deepStrictEqual([false, 'string'], [success, typeof error]);
  //   });
  // });

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

  describe('POST /users/test1@automart.com/reset_password', () => {
    it('Reset Password', async () => {
      const res = await request.post('/api/v1/users/test1@automart.com/reset_password')
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });

  describe('POST /users/test2@automart.com/reset_password', () => {
    it('Reset Password', async () => {
      const res = await request.post('/api/v1/users/test2@automart.com/reset_password')
        .send({
          password: 'testing',
          new_password: 'testings',
        })
        .set('accept', 'json')
        .expect(200);

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });
});

describe('Media Upload API', () => {
  let buyerToken;
  const data1 = 'data:application/octet-stream;base64,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';
  const data2 = 'data:application/octet-stream;base64,dwFohhhiVszZc2TM6SKPFY5HyPq6w80hyWj0VeTP2ajHwvw8b8fzn6V65R5qH46ZWzGvicvO7myNli9ArKrRnFpIS4IIHguYCM7KUEA+mOcpWAG6Hl37JbGsUljPNjt6ooFi00ZCKBYjKCPhNoVsE8HlypoU0yGm9sK5FhIw0nTZSrJokIqMkDZMkEchou2E9C2PQUBOMNRSA2StFYZ6t7Y4YXyvPRrGlxKKQtmu6H+ybxE1qIpKXT0tJTSbioriIW49cHf+SbQjkkb1fPsEUOkuF8l1rLpNW32GVj5vAHLCyInDgARkkZ6+3RZ82R44uUUWcdLLlUJeMr9l0FRWCnZTUcDWDuR1PuSvNzzynuTPYQwQxJKKNAt9nDImHlxgLnN7Nq8JRkXkLO3oUGyENdLOJWPaWAtd2KtjNoqcbMk1nw7p3+I8QNOcnorPzP8AYyxJ/RjF10o6Ov8ACjjJGeuFb+TQn41ZXb/QGna6IDBGxVuLbsqy6RRaXTFwv1XJFb6OasmGXFkLC44+Au3CUVHZ5fMmpNkPVW+SmldFLG6ORpw5rxgg+hCu0ZxY0hx0StABvoSeyjCBfQn0SEsUmpCOyVr7DYhPT4Psog2Jzw5G6ngpGzxIgFpI/KURb+jYaWiJAyN1qoYlqW3l2ABlFIhbtKcPLzrCvZQ2a2VVzq3dIqWIvd8nHQe5R8VkujQIfsxcQ2XWnt79KV8dRMQGlzPIP9zug+pUtCWegNBf8P8AqvvlLNqm+00dOMOlo7cDJIf9POcAfIyj2X0Cz2FonhTpHQtsjpLHpqnt7GgAyuhBlefUvO5KFlbTfpbKa3CkLzsQRtnsoKwktuivVoqqCpaH09RG6B7T6EYSTVrY0W4tNHkq66SqLBeq2iqRmWmkMef4h2P1GCvKZ4PHNxPccfKs2NTJako80re2Fio0XsE+l5HHIwEo9kfVvDGktPRJYUiq39wkhcC0Hb0VXZmlIyW82nwnyzFuCei1RbeitmUantchjqpy08o2yt+J7Rgyq0ypaakqrRcmVVLPJS1UbuZksZwQV0pOlo5X41K0zdTws/6hOHMt8Igo9WWuoNNNUMZhtRGQHNLwO/Xf2V+PJqzk5cf4p9TCNYcGtUaHkAu1pnigP4amNvPC8eoeNv1W5NSWjNe6Km61uB6KNWSwEtuJOMJeobEai25J2StaIQ9XREE7JUCyKqKY77IaGsip4cZyEAMRniIG4ymWxT0fpjRN01LUtpbZb6mvncdo6eJz3foAttVthbo9bcEPsHXW/OhuOtnvsdv2cKGPBqZR79mD539kHJfQHI9w6D4b6c4dWptt05aae3UzRhxY3Mkh9Xu6uPyq27E2T89LSOIdJA12OpI6KWGgTo6dxayFoaP9IwlsZIlIAQGse7OPVMhGM1ADWYAwnRWcUzRG09g7qo1ZDMOOWjpp6dmoKKLmdEBHWNaN+Ts/6d/b4XI5eHvHsvUdn+P5H45fjl4zKWV8UMADiOuF59nqErGC+GpA8NwOQqWqGSaK0QwV09O52CD0WeVo0fQrPYX1jnAdFWmP2SM14hwxUb20kQDpSPMtWK/WJLwompNNg6Yk8uXlvMtUJfMoyL4FRptCx1dPDPGC1xaMhbvyuOmc/wDHez0F9kmmfTajv1gkwW11F40bXd5IznH/AKuctnGalaORz4VFT/R6CtljpX0z6appmVNC9xY+GVod4Z7gg9l1ILRw5v7Mq4o/Yj0xq9stw048WKvdlxjjGYHH/Z2+n6K2itTa9PHXE7gJqfhfW+Hebe5tM8/uqyIc0Mnw7sfY7qelqnZmdZbCzblS0PZB1lBgHIVbj+g2QNZQ8pOyUPpBVlLudsBBrYCJqocE+iagP9n9BnCvhLpjhjZW23T1vjpovxOld5pXu9XOO5Vs/kRN/Zb6ilMZ27oReiNBaZpEfc/KhBSsnzNybbpWx0j7aoc1BDsnByCoiMspgYQDygkJ0VsBI3myAenZOKcsBa1vdMKNsYypifFI1r2uHK5rhkEeiqkh4s818W+FcukbiayiLzZql+WHr4Dj+Q+3ofouDy+N1+cVo9RweZ3X45+mdSUVTStEsEpyPRcqv2dxNMhLhcZ33OOYt82OV/bPuklBSQydFiprs9tNscDG49Vn6UGkyian0++v8St5v3runwrIyrQZKyrfc56inMErRy9CrrSdlLT8FINPTU5AjOGK15U/Sjo0aTwGs0lFxZsM7XEv53hwHdpjdnK2cXJeRUc3nQrC2z0pLF+z75USNb+4ma09Nub0PyF34M8rJaLbS26nqqVr4W8jnDoD0V9lNEZfNK0d8t89vudJFW0kzS18MzA5rh9UrJ4eQOMf2H4myT1+kqnw2Oy4UNTu0ezXdR9UrZYn+zxzrTQlz0jc5qC6UUlHVRndkjcZHqD3Huj9FllFr6DAO26TwhW66jDcjCXr9jWQlXTbHZT7Af0RWB3PG5h/8kbv1VxCbqaUSU5c0b4yqlpjMRe7w48HqmZEQ1S/M4/iVdltE5ZaX9217h0TorkSzt2nt7JhDmniaM5BOUWwBHQ4dkBSwNHbIxG/ORv2QbsiRxcbdTXahmo6yFlRTTNLHxvGQQkavTHTcXaPMXFDhtWcP6o1FPz1NkldiObqYj/A/wDse64vI4vW5R8PTcTmrL8Z+metgiqpSZAMlcmUaO12/Q863hkGGZIVDGTIaspTylp3CT/qLbIKe3BpJIHwiitn+jpNsYRZW9GpcBNNk6jrry9h8KhpnMYSOsj9h/LK63BjcnL9HC/ksnwUP2bjQULLpba7mAPn5Wn4H+V6HH4eamtnVgmfQzGkn2I/CfVXWVssk0DZY84QFI+ooWyxuaRlp9eqATHuMHAyx8QbW+Kvo2yOAPJMwYkiPq0/2SDI/NnjPwmr+GGqai11gMkX44Jw3AljPQ/PqnWywyC50eCdsqUHwgZrdLUyiKKN0sjtgxgyT8BI6XpNn9A1ql8Kuc4AgDZwThLXT/vITg5CV+gKrdaoU1UYicOyg3RbFWAoYTVytLtwkWx3ouNLTsggAAwVYUN2cmTmc4dkxDuIEjfZAAZw3GECH+P4lCHQzjdQgKso4LhSy01TCyenlaWvjkblrh6EINXoKbTtHn7iTwEqrW+S5aZa6qpB5n0BOZIx/oP5h7dflc3Pxb3A7fG59fHJ/wDTO6Qh7OV4LHt8rmuGCD6ELhzxuLo7kcifhH3CldguABPsqetFymQE8L3PwRt8I9aI5D9mss90rYaWlhdPUSuDWMaEYwcnUVsqyZIwi5SZ6FtNgZovTkNsh5ZJyQ+d7fzynt8Beiw4/wAUFFenk82V58jm/C2WenNptUccw/GcuPuV0Yqkc+Ttg7pTgtjmZjnac59UwpNW+Qy0zMjqERWhepcGS8nfrslbGQtV0omjcCO3RKMeQfttcP475puGuhjAq7cHS5xuY/zD+hQ7dZf2Wxj2TPIFPwutXhsmqHyVZe0OAzyt3+FzMvKndLR04cWFJvZmthA0txDpHu8rKas5HZ/hJx/QrZNd8X9owpdJn7lXOH7hc/GZsyQZIWnxlS2iw2WRslKOU5B3UAyi66mMF9hYDgSbYVUvS/GrRb7HQtigjJGcDqnSK5MmNnHCYrFZMeO4Y6IoYPDl2SeiAp0x4fIQN8KEOXP5JwD3R+gBuqATkSYJBKILO0AlQ1bwwsurS6aSL7pXH/7VOAHH/cOjlnyYIZPUacXIyYf9Xoyy68CL5TzSNppaeth/I7m5CfYg9CuXPgyv4nVh/IR/9kK0H2fLnUPa+4VUFDF3a087/wDCWPCk/wDZ0NP+Sil8VZolh0PaND0h+4w4ncMPqpd5Hew9At+PDHEvicnLnnmdyZI22zGtnFTOC2Nv4GHr8n3WqEPtmWc60h+8Rl9MWDHstBURcrTJStd05eo9VAWP22T/ALb1aECEdcKrw7tCCSGuGMeiSRYvCajaHjJ9EUKzHeNFlju5qaSVgfHNRvBBHbO6qyeo04no8H1trlsz5aCYEPpXuhz6gHAP6YXJzL52js4ncEYJxJovueqal428TlkB+R/kLqcf5YkcrOqyNn7p6lpvEt7pGjzR7q5meJ3psEUkZByxw2RC/SkcRT4mrrXC38T3gDZUy3I0YtRbNFpm/dqdrfQd1cZ/RmIeXONyoKLFpFS7O5PQZUD9BHymGL8P6KAPlECQ5x7lQgKqOayMIog8eiBBZ+Gv3O6YUYY7nblKMDm54vMzzDu1EV6OY6hlQW8p3G+O6DQbF6nxpJuSMNb/AKsZwh1slgzaWMdzE+K/H4nlRJAbZ8MXIA3G3oE/ggtVweNG4DqiQh3wuY1zSMhQgS2kRiRmd1BWVu8VLn1bt/NA7OVVIuiXCglbLTsdseZoKZFbM54mxg3aBvrSyf2VeRbRox+M8d8bbAKC50dwY3EdbCC7A/O3Y/ywuflj4zqYZ6aPLfFyi5aujqR+ZhjJ+Dn+618V2mjLyltM/caVglgLXgYcMHK1tGFMiNOTihqZbbNlr4yXRE9HN9Poq4vVFkleys3yH7/xZtURGWxROkKT2RbHWNmggc8u4wArSj6GGHOQoABgNnfIR0HVQgi6oNfPyMPkB3UDVEpGwRRho2AUAIyees74HsmQB4nDdtylCKzOPMMDcd0y8FYanJLeuQgwoMgEj62hcHeNCeV47DumTEaoAyvkiwJG7+qb0UM24MkGHEtKWiWEErHN2OURbOXNa5h2x32UARskbHNOB3UGEZIfBLpGY6IkKTcJi6rqzkjYbHuq5IsRc9J1AqbfGc5IGMIx8EkVDiLHz6kooz0dTSpJ+oug/i2ecuM1k/aHDU1Yb56Gpbg+gOx/qFncbizXjlWSjxtxTovvGnhMB5oJA76Hb/CHG1OmW8lXC/0f/9k=';
  const filename = `filename-${+new Date()}`;
  before(async () => {
    // User
    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test2@automart.com',
        password: 'testings',
      })
      .set('accept', 'json');
    buyerToken = res.body.data.token;
  });

  describe('POST /media', () => {
    it('Upload car AD image', async () => {
      const res = await request.post('/api/v1/media')
        .send({
          fileData: data1,
          filename,
          start: 0,
          extension: 'jpeg',
          uploading: true,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);
      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });

  describe('POST /media', () => {
    it('Upload car AD image', async () => {
      const res = await request.post('/api/v1/media')
        .send({
          fileData: data2,
          filename,
          start: 5120,
          extension: 'jpeg',
          uploading: false,
        })
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);
      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'string'], [success, typeof data]);
    });
  });

  describe('GET /media', () => {
    it('Get Uploaded car AD image', async () => {
      const res = await request.get('/api/v1/media')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('accept', 'json')
        .expect(200);
      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });
});


// after(async () => {
//   // await db.drop('orders');
// });
