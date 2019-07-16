import { Pool } from 'pg';
import {
  rtrim, prepareFilter, prepareFilterWhere, stringFormat,
} from '../helper';

export default class BaseModel {
  constructor(table) {
    try {
      this.db = new Pool({
        connectionString: process.env.NODE_ENV === 'test'
          ? process.env.TEST_PGUURL : process.env.PGURL,
      });
      this.table = table;
    } catch (e) {
      throw new Error(e);
    }
  }

  async execSql(sql, record = null) {
    const newRecord = Array.isArray(record) ? record : null;
    let result;
    // let client;
    const client = await this.db.connect();
    try {
      result = newRecord === null
        ? await client.query(sql) : await client.query(sql, newRecord);
    } catch (e) {
      throw new Error(`Errot with query or connection: ${sql}`);
    } finally {
      client.release();
    }
    return result;
  }

  async save(data, extra = []) {
    let columns = '';
    let placeholder = '';
    const payload = [];
    let counter = 1;
    let newData;
    let returnCols = ['id', 'created_on'];
    returnCols = returnCols.concat(extra);
    Object.keys(data).forEach((key) => {
      columns += `${key}, `;
      placeholder += `$${counter}, `;
      payload.push(data[key]);
      counter += 1;
    });
    const newColumns = rtrim(columns, ', ');
    const newPlaceholder = rtrim(placeholder, ', ');

    const sql = stringFormat(`INSERT INTO public.${this.table}(%s) VALUES(%s) RETURNING ${returnCols.join(', ')}`, [newColumns, newPlaceholder]);

    try {
      const { rows } = await this.execSql(sql, payload);
      const [insert] = rows;
      newData = { ...insert };
    } catch (e) {
      throw new Error(`Errot with query: ${sql}`);
    }
    return newData;
  }


  async updateById(data, id, extra = []) {
    const { columns, payload } = prepareFilter(data);
    let returnCols = ['id', 'created_on'];
    returnCols = returnCols.concat(extra);

    const sql = stringFormat(`UPDATE public.${this.table} SET %s WHERE id=%d RETURNING ${returnCols.join(', ')}`, [columns, parseInt(id, 10)]);
    try {
      return await this.execSql(sql, payload);
    } catch (e) {
      throw new Error(`Error updating Data: ${e}`);
    }
  }

  async updateByFilter(data, filters, extra = []) {
    const { columns, payload, counter } = prepareFilter(data);
    const { whereClause, whereArray } = prepareFilterWhere(filters, counter);
    const cols = columns.concat(whereArray);
    let returnCols = ['id'];
    returnCols = returnCols.concat(extra);

    const sql = stringFormat(`UPDATE public.${this.table} SET %s WHERE %s RETURNING ${returnCols.join(', ')}`, [cols, whereClause]);
    try {
      return await this.execSql(sql, payload);
    } catch (e) {
      throw new Error(`Error updating Data: ${e}`);
    }
  }

  async findAll(columns = ['*']) {
    const sql = stringFormat(`SELECT ${columns.join(', ')} FROM public.${this.table}`);
    try {
      return await this.execSql(sql);
    } catch (e) {
      throw new Error(`Error finding all Data: ${e}`);
    }
  }

  async findById(id, columns = ['*']) {
    const sql = stringFormat(`SELECT ${columns.join(', ')} FROM public.${this.table} WHERE id=$1`);
    try {
      return await this.execSql(sql, [parseInt(id, 10)]);
    } catch (e) {
      throw new Error(`Error finding data by Id: ${e}`);
    }
  }

  async findByFilter(filters, columns = ['*'], single = false) {
    const limit = single === true ? ' LIMIT 1' : '';
    const { whereClause, whereArray } = prepareFilterWhere(filters);


    const sql = stringFormat(`SELECT ${columns.join(', ')} FROM public.${this.table} WHERE ${whereClause} ${limit}`);
    try {
      return await this.execSql(sql, whereArray);
    } catch (e) {
      throw new Error(`Error finding Data: ${e}`);
    }
  }

  async removeById(id) {
    const sql = `DELETE FROM public.${this.table} WHERE id=$1`;
    try {
      return await this.execSql(sql, [parseInt(id, 10)]);
    } catch (e) {
      throw new Error(`Error deleting Data: ${e}`);
    }
  }

  async removeByFilter(filters) {
    const { whereClause, whereArray } = prepareFilterWhere(filters);
    const sql = stringFormat(`DELETE FROM public.${this.table} WHERE %s`, [whereClause]);
    try {
      return await this.execSql(sql, whereArray);
    } catch (e) {
      throw new Error(`Error deleting Data: ${e}`);
    }
  }

  async removeAll() {
    try {
      return await this.execSql(`DELETE FROM public.${this.table}`);
    } catch (e) {
      throw new Error(`Error Deleting all rows: ${e}`);
    }
  }
}
