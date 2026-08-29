import { createLogger, format, transports } from 'winston';
import * as winston from 'winston';
import * as fs from 'fs';

const { combine, timestamp, json, colorize, printf } = format;

if (process.env.NODE_ENV === 'production' && !fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const consoleFormat = printf((info: any) => {
  const { level, message, timestamp, ...meta } = info;
  return `${timestamp} [${level}]: ${String(message)} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    process.env.NODE_ENV === 'production' ? json() : consoleFormat,
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: json(),
          }),
          new transports.File({
            filename: 'logs/combined.log',
            format: json(),
          }),
        ]
      : []),
  ],
});

// Ajouter un ID de trace
export const addTraceId = (req: any) => {
  const traceId =
    req.headers['x-trace-id'] || Math.random().toString(36).substring(7);
  return traceId;
};