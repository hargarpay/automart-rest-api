import BaseModel from '../models/model';

export const transformData = (data, key, initial) => (data[key] ? `${data[key]}`.toLowerCase() : initial);

export const getFilteredRecord = (column, operator, placeholder, logic = '') => {
  let record;
  switch (operator) {
    case '=':
    case '<':
    case '<=':
    case '>':
    case '>=':
      record = `${column} ${operator} ${placeholder} ${logic}`;
      break;
    // case 'notContain':
    //   datum = transformData(data, key, []);
    //   record = notContainFnc(data, datum, value);
    //   break;
    default:
      record = [];
  }
  return record;
};

export const uniqueData = async (value, parameters) => {
  const [table, column] = parameters;
  const db = new BaseModel(table);
  try {
    const { rows } = await db.findByFilter({
      [column]: {
        column, value, operator: '=', logic: '',
      },
    });
    const status = rows.length > 0;
    return {
      status,
      message: `${value} already exist in ${column} field`,
    };
  } catch (e) {
    throw new Error(`Error thrown: ${e}`);
  } finally {
    await db.db.end();
  }
};
