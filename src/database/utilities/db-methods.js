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

export const getFilteredRecord = (data, key, value, operator) => {
  let record;
  let datum;
  switch (operator) {
    case 'eq':
      datum = data[key] ? data[key].toLowerCase() : null;
      record = datum === value.toLowerCase() ? data : [];
      break;
    case 'neq':
      datum = data[key] ? data[key].toLowerCase() : null;
      record = datum !== value.toLowerCase() ? data : [];
      break;
    case 'gt':
      record = data[key] > value ? data : [];
      break;
    case 'lt':
      record = data[key] < value ? data : [];
      break;
    case 'gte':
      record = data[key] >= value ? data : [];
      break;
    case 'lte':
      record = data[key] <= value ? data : [];
      break;
    case 'contain':
      datum = data[key] ? data[key].toLowerCase() : [];
      record = datum.indexOf(value.toLowerCase()) > -1 ? data : [];
      break;
    case 'notContain':
      datum = data[key] ? data[key].toLowerCase() : [];
      record = datum.indexOf(value.toLowerCase()) === -1 ? data : [];
      break;
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
  let newId;
  payloads.forEach((payload) => {
    newId = id + 1;
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
    const record = data.find(datum => datum.id === recordId);
    return record;
  });

// export const createTable = (db) => {
//   new
// }
