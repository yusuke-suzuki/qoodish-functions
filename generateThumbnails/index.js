const { Storage } = require('@google-cloud/storage');
const path = require('path');
const os = require('os');
const fs = require('fs');
const mkdirp = require('mkdirp');
const sharp = require('sharp');
const gcs = new Storage();
const resizedImagesPath = 'thumbnails';

const imageSizes = [
  {
    width: 200,
    height: 200
  },
  {
    width: 400,
    height: 400
  },
  {
    width: 800,
    height: 800
  }
];

const extractFileNameWithoutExtension = (filePath, ext) => {
  return path.basename(filePath, ext);
};

const resizeImage = async ({
  bucket,
  originalFile,
  fileDir,
  fileNameWithoutExtension,
  fileExtension,
  contentType,
  size,
  objectMetadata
}) => {
  const resizedFileName = `${fileNameWithoutExtension}_${size.width}x${size.height}${fileExtension}`;

  console.log(`Start resizing image: ${resizedFileName}`);

  const resizedFilePath = path.normalize(
    path.join(fileDir, resizedImagesPath, resizedFileName)
  );

  console.log(`Resized file path: ${resizedFilePath}`);

  let resizedFile;

  try {
    resizedFile = path.join(os.tmpdir(), resizedFileName);

    console.log(`Resizing file: ${resizedFile}`);

    const metadata = {
      contentDisposition: objectMetadata.contentDisposition,
      contentEncoding: objectMetadata.contentEncoding,
      contentLanguage: objectMetadata.contentLanguage,
      contentType: contentType,
      metadata: objectMetadata.metadata || {},
      cacheControl: 'public,max-age=15552000'
    };
    metadata.metadata.resizedImage = true;

    console.log(`Metadata: ${JSON.stringify(metadata)}`);

    await sharp(originalFile)
      .rotate()
      .resize(size.width, size.height)
      .toFile(resizedFile);

    console.log('Successfully resized image.');

    await bucket.upload(resizedFile, {
      destination: resizedFilePath,
      metadata
    });

    console.log('Successfully uploaded image.');

    return { size, success: true };
  } catch (err) {
    console.log(err);
    return { size, success: false };
  } finally {
    try {
      if (resizedFile) {
        fs.unlinkSync(resizedFile);
      }
    } catch (err) {
      console.log(err);
    }
  }
};

const generateThumbnails = async object => {
  const { contentType } = object;
  const filePath = object.name;
  const fileName = path.basename(filePath);
  const bucket = gcs.bucket(object.bucket);

  if (!contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  if (object.metadata && object.metadata.resizedImage === 'true') {
    console.log('This is an already resized image.');
    return null;
  }

  if (fileName.startsWith('thumb_')) {
    console.log('Already a Thumbnail.');
    return null;
  }

  console.log('Start generating thumbnails.');

  const fileDir = path.dirname(filePath);
  const fileExtension = path.extname(filePath);
  const fileNameWithoutExtension = extractFileNameWithoutExtension(
    filePath,
    fileExtension
  );
  const objectMetadata = object;

  let originalFile;
  let remoteFile;

  try {
    originalFile = path.join(os.tmpdir(), filePath);

    const tempLocalDir = path.dirname(originalFile);
    await mkdirp(tempLocalDir);

    remoteFile = bucket.file(filePath);
    await remoteFile.download({ destination: originalFile });

    const results = [];

    for (let size of imageSizes) {
      const result = await resizeImage({
        bucket,
        originalFile,
        fileDir,
        fileNameWithoutExtension,
        fileExtension,
        contentType,
        size,
        objectMetadata: objectMetadata
      });

      results.push(result);
    }

    const failed = results.some(result => result.success === false);

    if (failed) {
      console.log('Failed to resize image.');
      return;
    }

    console.log('Succeessfully generated thumbnails.');
  } catch (err) {
    console.log(err);
  } finally {
    if (originalFile) {
      fs.unlinkSync(originalFile);
    }
  }
};

module.exports = generateThumbnails;
