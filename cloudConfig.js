const path = require("path");
const crypto = require("crypto");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const storage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, `basera/${Date.now()}-${randomSuffix}${ext}`);
  },
});

module.exports = { s3, storage };