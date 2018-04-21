DROP DATABASE IF EXISTS replybot;
CREATE DATABASE replybot;

\c replybot;

CREATE TABLE Accounts (
  id SERIAL PRIMARY KEY,
  email VARCHAR,
  password VARCHAR,
  appstate TEXT,
  start BIGINT,
  stop BIGINT,
  msg TEXT
);

CREATE TABLE Logs (
  id SERIAL PRIMARY KEY,
  created BIGINT,
  code VARCHAR,
  content TEXT
);
