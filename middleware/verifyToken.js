const jwt = require('jsonwebtoken');
const pool = require('./connection');
const { JWT_KEYS } = require('./keys')

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  console.log("authorization", authorization)
  if (!authorization) {
    return res.status(422).json({ error: "You must be logged in" });
  }

  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, JWT_KEYS, (err, payload) => {
    if (err) {
      return res.status(422).json({ error: "You must be logged in gg" });
    }
    const { id } = payload;
    pool().getConnection(async function (err, connection) {
        if (err) {
            connection.release();
            return res.status(422).json({ status: "fail", error: err })
        }
      const sql1 = 'SELECT * FROM admin WHERE id = ?';
      const value1 = [id];
      connection.query(sql1, value1, (err, result) => {
        connection.release();
        if (err) {
          console.error('Error fetching user:', err);
          return res.status(500).json({ error: 'Failed to retrieve user' });
        }
        console.log("result", result);
        if (result.length === 0) {
          return res.status(400).json({ status: "fail", message: "No user found" });
        }
        req.admin = result[0];
        console.error('result', result[0]);
        next();
      });
    });
  });
};
