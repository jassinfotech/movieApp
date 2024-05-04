const { createPool } = require('mysql2');
var pool = null;
function getDBPool() {
    if (pool && !pool._closed) return pool;
    //New production
    pool = createPool({
        host: 'localhost',
        user: 'root',
        database: 'selectkaroadmin',
        password: '',
    });

    return pool;
}

module.exports = getDBPool;