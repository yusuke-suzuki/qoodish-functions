const { Storage } = require('@google-cloud/storage');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

const gcs = new Storage();

const generateThumbnail = async object => {
  const filePath = object.name;
  const contentType = object.contentType;
  const fileName = path.basename(filePath);
  const bucket = gcs.bucket(object.bucket);

  if (!contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  if (fileName.startsWith('thumb_')) {
    console.log('Already a Thumbnail.');
    return null;
  }

  const tempFilePath = path.join(os.tmpdir(), fileName);
  const metadata = {
    contentType: contentType,
    cacheControl: 'public,max-age=86400'
  };

  await bucket.file(filePath).download({ destination: tempFilePath });
  console.log('Image downloaded locally to', tempFilePath);

  // Generate a thumbnail using ImageMagick.
  await spawn('convert', [
    tempFilePath,
    '-thumbnail',
    '200x200>',
    tempFilePath
  ]);
  console.log('Thumbnail created at', tempFilePath);

  // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);

  // Uploading the thumbnail.
  await bucket.upload(tempFilePath, {
    destination: thumbFilePath,
    metadata: metadata
  });

  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  return fs.unlinkSync(tempFilePath);
};

module.exports = generateThumbnail;
