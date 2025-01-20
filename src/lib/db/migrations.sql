---
--- 0001 initial migration
---
CREATE TABLE sources (
  id               TEXT   PRIMARY KEY,
  title            TEXT      NOT NULL,
  description      TEXT      NOT NULL,
  language         CHAR(2)   NOT NULL DEFAULT 'ar',
  default_quantity INTEGER   NOT NULL DEFAULT 1,
  start_at         INTEGER   NOT NULL DEFAULT 1,
  is_complete      BOOLEAN   NOT NULL DEFAULT 1,
  category_id      INTEGER   NOT NULL,
  source_type      INTEGER   NOT NULL,
  other_attrs      JSON      NOT NULL DEFAULT '{}',
  featured         BOOLEAN   NOT NULL DEFAULT 0,
  version          INTEGER   NOT NULL,
  size             INTEGER   NOT NULL,
  len              INTEGER   NOT NULL,
  is_user_source   BOOLEAN   NOT NULL DEFAULT 0,
  created_at       DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT source_title_type_unique UNIQUE (title, source_type)
);

CREATE TABLE subscriptions (
  id               INTEGER PRIMARY KEY,
  source_id        INTEGER NOT NULL,
  quantity         INTEGER NOT NULL,
  has_read_up_to   INTEGER NOT NULL DEFAULT 0,
  due_up_to        INTEGER NOT NULL DEFAULT 0,
  schedule_by_unit INTEGER NOT NULL DEFAULT 1 CHECK(schedule_by_unit IN (1, 2)),
  interval         INTEGER NOT NULL DEFAULT 1,
  days_of_week     TEXT    NOT NULL DEFAULT "1,2,3,4,5,6,7",
  hour             INTEGER NULL,
  is_active        BOOLEAN NOT NULL DEFAULT 1,
  has_ended        BOOLEAN NOT NULL DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_id) REFERENCES sources(id),
  CONSTRAINT subscription_source_unique UNIQUE (source_id)
);

CREATE TABLE study_entries (
  id INTEGER PRIMARY KEY,
  source_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  studied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);

INSERT INTO sources (
    id, title, description, category_id, source_type, 
    version, size, len, is_complete
) VALUES 
('src1', 'Test Book', 'Description', 1, 1, 1, 100, 100, 1);

INSERT INTO subscriptions (
    source_id,
    quantity,
    has_read_up_to,
    due_up_to,
    schedule_by_unit,
    interval,
    days_of_week,
    hour,
    is_active,
    has_ended
) VALUES (
    'src1',
    5,
    10,
    15,
    1,
    2,
    "1,3,5",
    14,
    1,
    0
);

INSERT INTO study_entries (source_id, quantity, studied_at) VALUES
('src1', 2, date('now')),
('src1', 3, date('now', '-1 day')),
('src1', 1, date('now', '-2 day')),
('src1', 4, date('now', '-3 day')),
('src1', 2, date('now', '-4 day')),
('src1', 2, date('now', '-10 day')),
('src1', 3, date('now', '-11 day')),
('src1', 1, date('now', '-20 day'));

PRAGMA user_version = 1;
