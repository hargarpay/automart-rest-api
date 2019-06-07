import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import debug from 'debug';
import * as db from '../database/utilities/db-methods';

let table = 'users';
const bcryptSalt = +process.env.BCRYPT_SALT;
const jwtSalt = process.env.SECRET_KEY || 'test';

// const userDebug = debug('automart:user');

export const register = async (req, res) => {
  // await db.clear(table);
  const { body, query } = req;
  if (query.test) {
    table = 'test/users';
  }

  const hashPassword = bcrypt.hashSync(body.password, bcrypt.genSaltSync(bcryptSalt));
  const payload = { ...body, ...{ password: hashPassword, is_admin: false } };
  try {
    const user = await db.save(table, payload);
    const token = jwt.sign({ id: user.id }, jwtSalt, { expiresIn: 43200 });
    const newPayload = { ...user, ...{ token } };

    delete newPayload.password;
    // userDebug(newPayload);
    return res.status(200).send({
      success: true,
      data: newPayload,
    });
  } catch (error) {
    // userDebug(error);
    return res.status(501)
      .send({
        success: false,
        message: `There was an error creating user ${error}`,
      });
  }
};

export const login = async () => {};
