import BaseModel from '../models/model';


// eslint-disable-next-line import/prefer-default-export
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
    return { status, message: `${value} already exist in ${column} field` };
  } catch (e) {
    throw new Error(`Error thrown: ${e}`);
  } finally { await db.db.end(); }
};
