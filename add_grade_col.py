import sqlite3

# Fix main dev.db
db = sqlite3.connect('dev.db')
cursor = db.cursor()
cursor.execute('PRAGMA table_info(Student)')
cols = [c[1] for c in cursor.fetchall()]
print("Student columns in main dev.db:", cols)

if 'gradeId' not in cols:
    cursor.execute('ALTER TABLE Student ADD COLUMN gradeId TEXT')
    db.commit()
    print("Added gradeId column to main dev.db")
else:
    print("gradeId already exists in main dev.db")
db.close()

# Fix PortableApp dev.db
db2 = sqlite3.connect('PortableApp/dev.db')
cursor2 = db2.cursor()
cursor2.execute('PRAGMA table_info(Student)')
cols2 = [c[1] for c in cursor2.fetchall()]
print("Student columns in PortableApp dev.db:", cols2)

if 'gradeId' not in cols2:
    cursor2.execute('ALTER TABLE Student ADD COLUMN gradeId TEXT')
    db2.commit()
    print("Added gradeId column to PortableApp dev.db")
else:
    print("gradeId already exists in PortableApp dev.db")
db2.close()

print("Done!")
