export const rtrim = (str, remove, replace = '') => {
  const lastIndex = str.lastIndexOf(remove);
  const newStr = str.replace(new RegExp(remove, 'g'),
    (match, offset) => (offset === lastIndex ? replace : match));
  return newStr;
};

export const stringFormat = (str, replacer) => {
  let counter = -1;
  const newStr = str.replace(/%(s|d)/g, () => {
    counter += 1;
    return replacer[counter];
  });
  return newStr;
};

export const propsAvailable = (name, objectData) => Object.prototype
  .hasOwnProperty.call(objectData, name);

export const isEmpty = (val, str = false) => {
  let empty = val === null || val === undefined;
  if (!empty && str === true) {
    empty = val.trim() === '';
  }
  return empty;
};

export const propExist = (obj, props, depth, max) => {
  // props[depth] is each array of properties to check in the object
  // obj[props[depth]] Get the value of the props
  const exist = isEmpty(obj) ? false : propsAvailable(props[depth], obj);
  // Check if the propert exist in the object
  if (!exist) {
    //  if it does not exist return false
    return false;
  }
  const newObj = obj[props[depth]];
  // Go to the child property
  const newDepth = depth + 1;
  // If the depth is attain return false
  // Else check if the child property exist
  return newDepth === max ? true : propExist(newObj, props, newDepth, max);
};

export function deepPropsExist(obj, ...props) {
  // tslint:disable-next-line:no-shadowed-constiable
  const depth = props.length;
  return propExist(obj, props, 0, depth);
}

export function invalidMinLength(value, min) {
  // console.log(`${value}`.length < min, `${value}`.length, min);
  return `${value}`.length < min;
}

export function invalidMaxLength(value, max) {
  return `${value}`.length > max;
}

export function invalidAllowExts(value, extensions) {
  return !Array.isArray(extensions) || extensions.indexOf(value) === -1;
}

export function invalidEmail(value) {
  return !(/[a-zA-Z0-9._#~&-]+@[a-zA-Z0-9._#~&-]+\.[a-z]{2,}/.test(value));
}

export function invalidCompare(value, compareValue) {
  return value !== compareValue;
}

export const prepareFilter = (data) => {
  let cols = '';
  const payload = [];
  let counter = 1;
  Object.keys(data).forEach((key) => {
    cols += `${key} = $${counter}, `;
    payload.push(data[key]);
    counter += 1;
  });
  const columns = rtrim(cols, ', ');
  return { columns, payload, counter };
};

export const prepareFilterWhere = (filters, counter = 1) => {
  let where = '';
  const whereArray = [];
  let count = counter;

  Object.keys(filters)
    .sort((a, b) => (filters[a].logic > filters[b].logic ? -1 : 1))
    .forEach((key) => {
      const {
        operator, column, value, logic,
      } = filters[key];
      where += `${column} ${operator} $${count} ${logic} `;
      whereArray.push(value);
      count += 1;
    });
  const whereClause = rtrim(where, ' ');
  return { whereClause, whereArray };
};

export const expectObj = (obj, expected, unwanted = []) => {
  const arr = [];
  const accepted = { ...obj };
  Object.keys(obj).forEach((key) => {
    if (!expected.includes(key)) {
      arr.push(key);
    } else if (unwanted.includes(key)) {
      delete accepted[key];
    }
  });
  const status = arr.length > 0;
  const message = arr.length > 0
    ? `Only ${expected.join(', ')} are allow, ${arr.join(', ')} ${arr.length === 1 ? 'is' : 'are'} not allowed`
    : '';
  return { status, message, accepted };
};

export const responseData = (res, success, code, data) => {
  let status;
  let dataKey;
  if (success) {
    status = 'succeed';
    dataKey = 'data';
  } else {
    status = 'error';
    dataKey = 'error';
  }
  return res.status(code).send({
    status,
    success,
    [dataKey]: data,
  });
};

export const throwError = (code, msg) => {
  // eslint-disable-next-line no-throw-literal
  throw ({ success: false, code, msg });
};

export const getResponseData = (e, serverDubug, serverError) => {
  const success = false; let statusCode; let errorMsg;
  if (typeof e === 'object') {
    statusCode = e.code;
    errorMsg = e.msg;
  } else {
    serverDubug(e);
    statusCode = 500;
    errorMsg = serverError;
  }
  return { success, code: statusCode, msg: errorMsg };
};
