DROP DATABASE IF EXISTS replybot;
CREATE DATABASE replybot;

\c replybot;

CREATE TABLE Bots (
  id SERIAL PRIMARY KEY,
  email VARCHAR,
  password VARCHAR,
  appstate TEXT,
  active VARCHAR
);

CREATE TABLE Logs (
  id SERIAL PRIMARY KEY,
  created BIGINT,
  code VARCHAR,
  content TEXT
);

INSERT INTO Logs (
  created, code, content
) VALUES (
  '1', 'code', 'content'
);
