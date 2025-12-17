const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'sqlite.db');

try {
    if (fs.existsSync(dbPath)) {
        // Try to rename first (sometimes works if locked but open for sharing? mostly no on Windows)
        // Try unlink
        fs.unlinkSync(dbPath);
        console.log('Successfully deleted sqlite.db');
    } else {
        console.log('sqlite.db does not exist');
    }
} catch (e) {
    console.error('Failed to delete sqlite.db:', e.message);
    // If failed, maybe try to truncate?
    try {
        fs.writeFileSync(dbPath, '');
        console.log('Truncated sqlite.db');
    } catch (e2) {
        console.error('Failed to truncate sqlite.db:', e2.message);
    }
}
