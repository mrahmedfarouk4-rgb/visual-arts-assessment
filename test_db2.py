import sqlite3
db = sqlite3.connect('dev.db')
cursor = db.cursor()
cursor.execute('PRAGMA table_info(Student)')
print("Student table columns:", cursor.fetchall())
