import sqlite3

DB_PATH = "edumate.db"

commands = [
    "ALTER TABLE lessons ADD COLUMN attachment_url VARCHAR;",
    "ALTER TABLE lessons ADD COLUMN attachment_name VARCHAR;",
    "ALTER TABLE lessons ADD COLUMN attachment_type VARCHAR;",
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

for cmd in commands:
    try:
        cur.execute(cmd)
        print("OK:", cmd)
    except Exception as e:
        print("SKIP/ERR:", cmd, "->", e)

conn.commit()
conn.close()
print("Done.")
