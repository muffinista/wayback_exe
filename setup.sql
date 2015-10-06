CREATE TABLE IF NOT EXISTS pages (
       id INT NOT NULL AUTO_INCREMENT,
       url text,
       score INT,
       created_at DATETIME NULL,
       posted_at DATETIME NULL,
       primary key (id)
);
