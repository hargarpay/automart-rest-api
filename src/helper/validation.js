import Validator from '../middlewares/validation';
import { throwError } from '.';

// eslint-disable-next-line import/prefer-default-export
export const makeValidation = (body, rules) => {
  const validate = new Validator();
  validate.make(body, rules);
  // If Validation passes
  if (validate.fails()) throwError(422, validate.getFirstError());
};
