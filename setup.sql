CREATE TABLE IF NOT EXISTS pages (
       id INT NOT NULL AUTO_INCREMENT,
       url text,
       tstamp varchar(20),
       title text,
       generator text,
       score INT,
       created_at DATETIME NULL,
       posted_at DATETIME NULL,
       primary key (id)
);

ALTER TABLE pages ADD COLUMN content LONGTEXT NULL;
ALTER TABLE pages ADD COLUMN host varchar(100) NULL;
