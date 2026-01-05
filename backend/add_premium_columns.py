import sqlite3
import os

# (backend/edumate.db)
DB_PATH = os.path.join(os.path.dirname(__file__), "edumate.db")

commands = [
    "ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';",
    "ALTER TABLE users ADD COLUMN premium_until DATETIME;",
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
print("DB used:", DB_PATH)
