import fs from 'fs';
import path from 'path';
// import debug from 'debug';

// const fileDebugger = debug('automart:file');
const testPath = process.env.NODE_ENV === 'test' ? 'test' : '';
export const pathTransformToCamelCase = filePath => filePath
  // .replace(/(\\|\/)(.|)/g, c => c.toUpperCase())
  .replace(/[^a-zA-Z]/g, '');

export const writeToFIle = (table, data) => {
  const filePath = path.join(__dirname, '..', 'data', testPath, `${table}.json`);
  const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8', flag: 'w' });
  return new Promise((resolve) => {
    writeStream.write(data);
    writeStream.end();
    resolve(data);
  });
};

export const readFromFile = async (table) => {
  const filePath = path.join(__dirname, '..', 'data', testPath, `${table}.json`);
  let data = '';
  if (!fs.existsSync(filePath)) {
    await writeToFIle(table, '[]');
  }
  const fileReadStream = fs.createReadStream(filePath, { encoding: 'utf8', flag: 'r' });
  return new Promise((resolve, reject) => {
    fileReadStream.on('data', (chunk) => {
      data += chunk;
    })
      .on('close', () => resolve(JSON.parse(data.replace(/\n/g, '') || '[]')))
      .on('error', err => reject(err));
  });
};

export const deleteFile = (table) => {
  const filePath = path.join(__dirname, '..', 'data', testPath, `${table}.json`);
  return new Promise(async (resolve, reject) => {
    try {
      fs.unlinkSync(filePath);
      const idTracker = await readFromFile('tableIdTracker');
      delete idTracker[pathTransformToCamelCase(table)];
      return resolve('File delected');
    } catch (err) {
      return reject(err);
    }
  });
};

export const lastIdStore = async (table, id) => {
  const idTracker = await readFromFile('tableIdTracker');
  const tablePropName = pathTransformToCamelCase(table);
  if (id === 0) {
    delete idTracker[tablePropName];
    const newIdTracker = { ...idTracker };
    await writeToFIle('tableIdTracker', JSON.stringify(newIdTracker));
    return;
  }
  const newIdTracker = { ...idTracker, ...{ [tablePropName]: id } };
  await writeToFIle('tableIdTracker', JSON.stringify(newIdTracker));
};

export const createTable = async (table) => {
  await writeToFIle(table, '[]');
  await lastIdStore(table, 0);
};
