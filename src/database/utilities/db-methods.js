import debug from 'debug';
import {
  readFromFile,
  writeToFIle,
  createTable,
  lastIdStore,
  pathTransformToCamelCase,
  deleteFile,
} from './file-manipulation';


const dataDebug = debug('automart:data');

const transformData = (data, key, initial) => (data[key] ? `${data[key]}`.toLowerCase() : initial);

const eqFnc = (data, datum, value) => (datum === `${value}`.toLowerCase() ? data : []);

// const neqFnc = (data, datum, value) => (datum !== `${value}`.toLowerCase() ? data : []);

// const gtFnc = (data, key, value) => (data[key] > +value ? data : []);

// const ltFnc = (data, key, value) => (data[key] < +value ? data : []);

const gteFnc = (data, key, value) => (data[key] >= +value ? data : []);

const lteFnc = (data, key, value) => (data[key] <= +value ? data : []);

const containFnc = (data, datum, value) => (datum.indexOf(`${value}`.toLowerCase()) > -1 ? data : []);

// const notContainFnc = (data, datum, value) => (
//   datum.indexOf(`${value}`.toLowerCase()) === -1 ? data : []
// );

export const getFilteredRecord = (data, key, value, operator) => {
  let record;
  let datum;
  switch (operator) {
    case 'eq':
      datum = transformData(data, key, null);
      record = eqFnc(data, datum, value);
      break;
    // case 'neq':
    //   datum = transformData(data, key, null);
    //   record = neqFnc(data, datum, value);
    //   break;
    // case 'gt':
    //   record = gtFnc(data, key, value);
    //   break;
    // case 'lt':
    //   record = ltFnc(data, key, value);
    //   break;
    case 'gte':
      record = gteFnc(data, key, value);
      break;
    case 'lte':
      record = lteFnc(data, key, value);
      break;
    case 'contain':
      datum = transformData(data, key, []);
      record = containFnc(data, datum, value);
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


export const storeLastId = async (table, id) => {
  await lastIdStore(table, id);
};

export const getLastId = async (table) => {
  const idTracker = await readFromFile('tableIdTracker');
  return idTracker[pathTransformToCamelCase(table)] || 0;
};

export const clear = async (table) => {
  await createTable(table);
};

export const drop = async (table) => {
  await deleteFile(table);
};

export const save = async (table, payload) => {
  const data = await readFromFile(table);
  const id = await getLastId(table);
  const newId = id + 1;
  const newPayload = { ...payload, ...{ id: newId } };
  data.push(newPayload);
  await storeLastId(table, newId);
  return writeToFIle(table, JSON.stringify(data))
    .then(() => newPayload);
};


export const saveMany = async (table, payloads) => {
  if (!Array.isArray(payloads)) throw new Error('Only array are acceted');
  const data = await readFromFile(table);
  const id = await getLastId(table);
  let newId = id;
  payloads.forEach((payload) => {
    newId += 1;
    data.push({ ...payload, ...{ id: newId } });
  });
  await storeLastId(table, newId);
  return writeToFIle(table, JSON.stringify(data))
    .then(() => payloads);
};

export const update = async (table, payload, recordId) => {
  const data = await readFromFile(table);
  const recordIndex = data.findIndex(datum => datum.id === recordId);
  const record = data[recordIndex];
  const newRecord = { ...record, ...payload };
  const newData = [...data];
  newData[recordIndex] = newRecord;
  await writeToFIle(table, JSON.stringify(newData));
  return newRecord;
};

export const remove = (table, recordId) => readFromFile(table)
  .then((data) => {
    const newData = data.filter(datum => datum.id !== recordId);
    return writeToFIle(table, JSON.stringify(newData))
      .then(res => dataDebug(res));
  });

export const findByFilter = async (table, filter) => {
  if (!Array.isArray(filter)) throw new Error('Only Array is allowed');
  const data = await readFromFile(table);
  const filterData = data.filter((datum) => {
    let record = datum;
    filter.forEach((prop) => {
      record = getFilteredRecord(record, prop.key, prop.value, prop.operation);
    });
    return !Array.isArray(record) && typeof record === 'object';
  });
  return filterData;
};

export const findAll = table => readFromFile(table)
  .then(data => data);

export const findById = (table, recordId) => readFromFile(table)
  .then((data) => {
    const record = data.find(datum => datum.id === +recordId);
    return record;
  });

// export const findFirst = async (table) => {
//   const data = await findAll(table);
//   const first = data.shift();
//   return first;
// };

// export const findLast = async (table) => {
//   const data = await findAll(table);
//   const last = data.pop();
//   return last;
// };

// export const createTable = (db) => {
//   new
// }
