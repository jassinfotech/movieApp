const express = require('express');
const router = express.Router();
const pool = require('../middleware/connection');
const { customerID } = require('../middleware/const')
const verifyToken = require('../middleware/verifyToken')
const multer = require('multer');
const path = require("path");

// file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }

});

const upload = multer({
    storage: storage
});

//  user get profile
router.get('/getprofile', verifyToken, (req, res) => {
    const { customerId } = req.body;
    // Check if customerId is provided
    pool().getConnection(async function (err, connection) {
        if (err) {
            return res.status(422).json({ status: "fail", error: err });
        }
        connection.query('SELECT * FROM users WHERE customerId = ?', [ customerId], (err, result) => {
            if (err) throw err;
            const userdata = result[0];
            if (result[0].length === 0) {
                return res.status(400).json({ code: 400, message: "Unable to update profile avtar" });
            } else {
                return res.status(200).json({ code: 200, userdata });
            }
        });
    })
})

// add user api 
router.post('/userprofile', verifyToken, upload.single('avtar'), (req, res) => {
    const { name, email, mobilenumber, Address, State, City, postalcode } = req.body;
    if (!name || !email || !mobilenumber || !Address || !State || !City || !postalcode || !req.file) {
        return res.status(400).json({ code: 400, message: 'All fields are required' });
    }
    pool().getConnection((err, connection) => {
        if (err) {
            return res.status(422).json({ status: 'fail', error: err });
        }
        connection.query('SELECT * FROM users WHERE email = ? AND  mobilenumber = ?', [email, mobilenumber], (err, results) => {
            if (err) throw err;
            console.log("results", results.length)
            if (results.length > 0) {
                return res.status(404).json({ code: 404, message: 'This Customer alrady aaded' });
            }

            connection.query('SELECT MAX(`customerId`) as max_customerId FROM users', (err, result) => {
                if (err) {
                    console.log("error", err);
                    return res.status(422).json({ status: 'fail', error: err });
                }
                console.log("result", result)
                let customerid;
                if (result[0].max_customerId === null) {
                    customerid = customerID;
                } else {
                    customerid = result[0].max_customerId + 1;
                }
                const file = req.file
                const filename = file.filename;
                console.log("customer_id", customerid)
                console.log("customerId", customerid)
                const createUserQuery = 'INSERT INTO users (name, customerId, email, mobilenumber, Address, State, City, postalcode, avtar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                connection.query(createUserQuery, [name, customerid, email, mobilenumber, Address, State, City, postalcode, filename], (err, result) => {
                    if (err) {
                        console.error('Error creating user:', err);
                        res.status(500).json({ error: 'Failed to  creating user' });
                    } else {
                        res.status(200).json({ code: 200, message: 'Customer added successfully' });
                    }
                })
            })
        })
    })
});

//  user update api
router.post('/editprofile', verifyToken, (req, res) => {
    const { customerId, name, email, mobilenumber, Address, State, City, postalcode } = req.body;
    // Check if customerId is provided
    if (!customerId) {
        return res.status(400).json({ code: 400, message: 'customerId is required' });
    }
    pool().getConnection((err, connection) => {
        if (err) {
            return res.status(422).json({ status: 'fail', error: err });
        }
        connection.query('SELECT * FROM users WHERE customerId = ?', [customerId], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                let data = {};
                if (name) {
                    data.name = name;
                }
                if (email) {
                    data.email = email;
                }
                if (mobilenumber) {
                    data.mobilenumber = mobilenumber;
                }
                if (Address) {
                    data.Address = Address;
                }
                if (State) {
                    data.State = State;
                }
                if (City) {
                    data.City = City;
                }
                if (postalcode) {
                    data.postalcode = postalcode;
                }
                console.log("data", data)
                if (Object.keys(data).length === 0) {
                    return res.status(400).json({ code: 400, message: 'No fields provided for updating' });
                }
                const updateQuery = 'UPDATE users SET ? WHERE id = ?';
                const updateValues = [data, results[0].id];
                connection.query(updateQuery, updateValues, (err, result) => {
                    if (err) {
                        return res.status(422).json({ status: 'fail', error: err });
                    }
                    res.status(200).json({ code: 200, message: 'Customer updated successfully' });
                });
            } else {
                return res.status(404).json({ code: 404, message: 'Customer not found' });
            }
        });
    });
});


//  user avtar api {image}
router.post('/update_avtar', verifyToken, upload.single('avtar'), (req, res) => {
    const { customerId } = req.body;
    // Check if customerId is provided
    if (!customerId) {
        return res.status(400).json({ code: 400, message: 'customerId is required' });
    }
    if (!req.file) {
        return res.status(400).json({ code: 400, message: 'file is required' });
    }
    const file = req.file;
    console.log('file', file);
    pool().getConnection(async function (err, connection) {
        if (err) {
            return res.status(422).json({ status: "fail", error: err });
        }
        if (file === undefined) {
            return res.status(400).json({ code: 400, message: 'No image file found' })
        }
        const filename = file.filename;
        connection.query('UPDATE users SET avtar = ? WHERE customerId = ?', [filename, customerId], (err, result) => {
            if (err) throw err;
            const affectedRows = result.affectedRows;
            if (affectedRows === 0) {
                return res.status(400).json({ code: 400, message: "Unable to update profile avtar" });
            } else {
                return res.status(200).json({ code: 200, message: "Profile avtar updated successfully" });
            }
        });
    })
})








module.exports = router;