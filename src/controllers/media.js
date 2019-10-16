import debug from 'debug';
import fs from 'fs';
import path from 'path';
import cloudinary from 'cloudinary';
import { expectObj, responseData } from '../helper';
import Validator from '../middlewares/validation';

// Set Cloudinary configuariotn file
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const cloudinaryV2 = cloudinary.v2;

const mediaDebug = debug('automart:media');

// export const localUplaod = (res, buff, filepath, extension) => {
//   fs.writeFile(`${filepath}.${extension}`, buff.toString(), 'base64', (err) => {
//     if (err) return responseData(res, false, 401, 'Error uploading file');
//     return fs.unlink(`${filepath}.txt`, (er) => {
//       if (er) return responseData(res, false, 404, 'Error Delete text file');
//       return responseData(res, true, 200, 'File Uplaeded successfully');
//       // file removed
//     });
//   });
// };

export const cloudinaryUpload = (req, res, base64Data, filepath) => {
  const filename = filepath.split('/').pop().toLowerCase();
  const { isAdmin, userImageTag } = req;
  const folderName = isAdmin ? 'admin' : userImageTag[0];
  cloudinaryV2.uploader.upload(base64Data,
    {
      folder: folderName,
      public_id: filename,
      tags: userImageTag.join(','),
    },
    (error, result) => {
      mediaDebug(result, error);
      if (error) return responseData(res, 401, false, 'Unable to upload file to cloudinary');
      //   mediaDebug(result.url.replace(/v[0-9]+\//, ''));
      return fs.unlink(`${filepath}.txt`, (er) => {
        if (er) responseData(res, false, 401, 'Error Delete text file');
        return responseData(res, true, 200, 'Uploading to cloudify');
      });
    });
};

export const convertText2Image = (req, res, filepath, extension) => {
  // Allocate memory to Buffer
  let buff = Buffer.alloc(0);
  // start a read stream for a test.txt file
  return fs.createReadStream(`${filepath}.txt`)
    .on('data', (chunk) => {
      // concatenate buff, and chunk both of which are buffers
      buff = Buffer.concat([buff, chunk], buff.length + chunk.length);
    })
    .on('end', () => cloudinaryUpload(req, res, `data:image/${extension};base64,${buff.toString()}`, filepath));
};

export const media = (req, res) => {
  const { body } = req;
  const fillable = ['filename', 'fileData', 'start', 'uploading', 'extension'];

  const { status, message, accepted } = expectObj(body, fillable);

  if (status) return responseData(res, false, 422, message);

  const validate = new Validator();
  validate.make(body, { extension: ['required', 'enum:jpeg,jpg,png'] });

  if (validate.fails()) return responseData(res, false, 422, validate.getFirstError());

  const {
    filename, fileData, start, uploading, extension,
  } = accepted;
  const filepath = path.join(__dirname, '../../assets', filename);
  const splitData = fileData.split('base64,');
  const mode = start === 0 ? 'w' : 'a';
  const stream = fs.createWriteStream(`${filepath}.txt`, { flags: mode });
  stream.write(Buffer.from(splitData[1]));
  stream.end();
  //   If the file has finish uploading convert it to image
  if (!uploading) {
    return convertText2Image(req, res, filepath, extension);
  }
  //   Send Out data
  return responseData(res, true, 200, 'Successfully uploaded');
};

export const getImages = (req, res) => {
  // const prefix = req.locPrefix;
  const { isAdmin, userImageTag } = req;
  const tag = isAdmin ? 'admin' : userImageTag[0];
  cloudinaryV2.api.resources_by_tag(tag,
    {
      tags: true,
      max_results: 50,
    }, (error, result) => {
      if (error) return responseData(res, false, 500, 'Error fetching Images');
      return responseData(res, true, 200, result);
    });
};
