import supertest from 'supertest';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import * as db from '../src/database/utilities/db-methods';
import app from '../server';

const request = supertest(app);

const bcryptSalt = +process.env.BCRYPT_SALT;

describe('User Authentication API Routes', () => {
  before(async () => {
    await db.clear('test/users');

    await db.saveMany('test/users', [
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

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
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

      const { success, data } = res.body;
      assert.deepStrictEqual([true, 'object'], [success, typeof data]);
    });
  });
});
