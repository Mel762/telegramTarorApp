const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Tables ---");
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        tables.forEach(table => {
            console.log(`\nTable: ${table.name}`);
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (err) console.error(err);
                else {
                    console.log("Columns:", columns.map(c => c.name).join(', '));
                }
            });

            // Show 1 sample row
            db.all(`SELECT * FROM ${table.name} LIMIT 1`, (err, rows) => {
                if (err) console.error(err);
                else if (rows.length > 0) {
                    console.log("Sample Row:", rows[0]);
                } else {
                    console.log("Sample Row: (empty)");
                }
            });
        });
    });
});

setTimeout(() => { db.close(); }, 2000);
