import debug from 'debug';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import {
  responseData, expectObj, isEmpty, getResponseData, throwError,
} from '../helper';
import Validator from '../middlewares/validation';
import BaseModel from '../models/model';

const resetPasswordDebug = debug('automart:resetPassword');
export const bcryptSalt = +process.env.BCRYPT_SALT;


const getHashPassword = (data, user) => {
  let sendMail = false; let hashPassword; let generatedPassord = '';
  if (isEmpty(data.password)) {
    generatedPassord = Math.random().toString(36).slice(-8);
    hashPassword = bcrypt.hashSync(generatedPassord, bcrypt.genSaltSync(bcryptSalt));
    sendMail = true;
  } else if (!bcrypt.compareSync(data.password, user.password)) {
    // eslint-disable-next-line no-throw-literal
    throw ({ success: false, code: 422, msg: 'Credential is invalid' });
  } else {
    hashPassword = bcrypt.hashSync(data.new_password, bcrypt.genSaltSync(bcryptSalt));
  }

  return { sendMail, hashPassword, generatedPassord };
};


// eslint-disable-next-line consistent-return
const sendNewPassword = async (sendingMail, password, data) => {
  if (!sendingMail) return false;
  const transport = nodemailer.createTransport(
    {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    },
  );

  await transport.sendMail({
    from: 'AutoMart <hargarpay@gmail.com>',
    to: `${data.fullname} <${data.email}`,
    subject: 'NEW PASSWORD',
    text: `Your reset password is ${password}`,
    html: `<p>Your reset password is <b>${password}</b></p>`,
  });
};

export const passwordReset = async (req, res) => {
  const { body, params } = req;
  const fillable = ['password', 'new_password'];

  const { status, message, accepted } = (expectObj(body, fillable));
  if (status) {
    // if there are invalid fields return error with feilds allowed
    return responseData(res, false, 422, message);
  }

  body.email = params.email;
  // Set Validation rule
  const rules = {
    email: ['required', 'email'],
    password: ['required_if_not_empty', 'min_length:6'],
  };

  if (!isEmpty(body.password)) {
    rules.new_password = ['required', 'min_length:6'];
  }

  const validate = new Validator();

  validate.make(body, rules);

  let sendingMail = false;
  let genPassword;
  accepted.email = params.email;

  const db = new BaseModel('users');
  try {
    if (validate.fails()) return throwError(422, validate.getFirstError());

    const { rows } = await db.findByFilter({
      email: {
        column: 'email', operator: '=', value: accepted.email, logic: '',
      },
    });

    // eslint-disable-next-line no-throw-literal
    if (rows.length === 0) throw ({ success: false, code: 422, msg: 'Email does not exist' });
    const [user] = rows;
    accepted.fullname = `${user.first_name} ${user.last_name}`;
    // If password is empty generate password if not updated the password
    const genPasswordObject = getHashPassword(accepted, user);
    sendingMail = genPasswordObject.sendMail;
    genPassword = genPasswordObject.generatedPassord;
    const hashGenPass = genPasswordObject.hashPassword;
    const successMsg = sendingMail === true
      ? 'New password has been sent to your mail'
      : 'The password has been updated';

    await db.updateById({ password: hashGenPass }, user.id);
    return responseData(res, true, 200, successMsg);
  } catch (e) {
    const { success, code, msg } = getResponseData(e, resetPasswordDebug, 'Error Resetting Password');
    return responseData(res, success, code, msg);
  } finally {
    db.db.end();
    sendNewPassword(sendingMail, genPassword, accepted);
  }
};
