const winston = require("winston");
const WinstonCloudWatch = require("winston-cloudwatch");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "basera-app" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}] ${stack || message}`;
        })
      ),
    }),
  ],
});

if (process.env.NODE_ENV === "production" && process.env.AWS_CLOUDWATCH_LOG_GROUP) {
  logger.add(
    new WinstonCloudWatch({
      logGroupName: process.env.AWS_CLOUDWATCH_LOG_GROUP,
      logStreamName: process.env.AWS_CLOUDWATCH_LOG_STREAM || "basera-app-stream",
      awsRegion: process.env.AWS_REGION,
      jsonMessage: true,
    })
  );
}

module.exports = logger;