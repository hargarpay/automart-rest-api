import supertest from 'supertest';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import * as db from '../src/database/utilities/db-methods';
import app from '../server';

const request = supertest(app);

const bcryptSalt = +process.env.BCRYPT_SALT;

describe('User Authentication API Routes', () => {
  before(async () => {
    await db.clear('users');

    await db.saveMany('users', [
      {
        first_name: 'test 1 first name',
        last_name: 'test 1 last name',
        email: 'test1@automart.com',
        address: 'test 1 home address',
        is_admin: false,
        password: bcrypt.hashSync('secret', bcrypt.genSaltSync(bcryptSalt)),
      },
      {
        first_name: 'test 2 first name',
        last_name: 'test 2 last name',
        email: 'test2@automart.com',
        address: 'test 2 home address',
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
  let newToken;
  before(async () => {
    await db.clear('cars');

    await db.saveMany('cars',
      [
        {
          owner: 1,
          created_on: new Date(),
          manufacturer: 'Toyota',
          model: '4Runner',
          price: 120000.50,
          state: 'used',
          status: 'available',
          body_type: 'car',
        },
        {
          owner: 1,
          created_on: new Date(),
          manufacturer: 'Toyota',
          model: 'Corolla',
          price: 80000,
          state: 'used',
          status: 'available',
          body_type: 'car',
        },
        {
          owner: 1,
          created_on: new Date(),
          manufacturer: 'Lexus',
          model: 'MX',
          price: 220000,
          state: 'new',
          status: 'available',
          body_type: 'car',
        },
        {
          owner: 1,
          created_on: new Date(),
          manufacturer: 'Ford',
          model: 'EcoSport',
          price: 150000.50,
          state: 'used',
          status: 'sold',
          body_type: 'car',
        },
      ]);

    const res = await request.post('/api/v1/auth/signin')
      .send({
        email: 'test1@automart.com',
        password: 'secret',
      })
      .set('accept', 'json');
    const { payload } = res.body;
    newToken = payload.token;
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
        .set('x-access-token', `Bearer ${newToken}`)
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
          state: 'old',
          body_type: 'car',
        })
        .set('x-access-token', `Bearer ${newToken}`)
        .set('accept', 'json')
        .expect(200);

      const { success, payload } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof payload]);
    });
  });
});
