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


ALTER TABLE pages ADD COLUMN approved_at DATETIME NULL;

create index approved_at on pages(approved_at);


alter table pages add column random_key int(11) not null default 0;
update pages set random_key = 10000 * rand() where 1;
create index lookup on pages(posted_at, approved_at, host, random_key);
