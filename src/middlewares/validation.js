import {
  isEmpty, invalidMinLength, invalidMaxLength, invalidEmail, invalidCompare,
} from '../helper';

export default class Validator {
  constructor() {
    this.errors = {};
    this.keys = [];
  }

  make(data, rules) {
    const validationRule = { ...rules };
    Object.keys(validationRule).forEach((key) => {
      if (
        validationRule[key].includes('required_if_not_empty')
        && isEmpty(data[key])
      ) delete validationRule[key];
      rules[key].forEach((rule) => {
        this.processValidation(rule, key, data);
      });
    });
  }

  processValidation(rule, key, data) {
    const [type, params] = rule.split(':');
    let status = false;
    let message;
    const paramters = !isEmpty(params) ? `${params}`.split('|') : [];
    switch (type) {
      case 'required':
        status = isEmpty(data[key]);
        message = `The ${key} field can not be empty because it is required`;
        break;
      case 'required_if_not_empty':
        message = '';
        break;
      case 'min_length':
        status = invalidMinLength(data[key], parseInt(paramters[0], 10));
        message = `The ${key} field must not be less than ${paramters[0]}`;
        break;
      case 'max_length':
        status = invalidMaxLength(data[key], parseInt(paramters[0], 10));
        message = `The ${key} field must not be greater than ${paramters[0]}`;
        break;
      case 'email':
        status = invalidEmail(data[key]);
        message = `The ${key} feild has invalid email`;
        break;
      case 'compare':
        status = invalidCompare(data[key], data[paramters[0]]);
        message = `The ${key} field does not match ${paramters[0]} field`;
        break;
      case 'enum':
        status = !paramters[0].split(',').includes(data[key]);
        message = `The ${key} field can only be ${paramters[0]}, it also case sensitive`;
        break;
      case 'is_number':
      case 'is_numeric':
        // eslint-disable-next-line no-restricted-globals
        status = isNaN(data[key]);
        message = `The ${key} feild can only be a number`;
        break;
      case 'is_boolean':
        status = typeof data[key] !== 'boolean';
        message = `The ${key} feild can only be a boolean`;
        break;
      default:
        throw new Error(`${type} validator type can not be use with [${key}] because it does not exist`);
    }

    return this.addError(key, status, message);
  }

  addError(key, status, message) {
    if (status && isEmpty(this.errors[key])) {
      this.errors[key] = message;
      this.keys.push(key);
      return true;
    }
    return null;
  }

  getErrors() {
    return this.errors;
  }

  getFirstError() {
    const [first] = this.keys;
    return !isEmpty(first) ? this.errors[first] : null;
  }

  passes() {
    return Object.keys(this.errors).length === 0;
  }

  fails() {
    return Object.keys(this.errors).length > 0;
  }

  // clear() {
  //   this.errors = [];
  // }
}
