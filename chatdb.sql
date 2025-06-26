CREATE DATABASE chatdb;
USE chatdb;

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT,
    recipient_id BIGINT,
    content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (recipient_id) REFERENCES user(id)
);
