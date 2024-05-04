const express = require('express');
const router = express.Router();
const pool = require('../middleware/connection');
const verifyToken = require('../middleware/verifyToken')
const jwt = require('jsonwebtoken');
const { JWT_KEYS } = require('../middleware/keys')
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require("path");
const { v4: uuidv4 } = require('uuid');

// file uploads
const storage = multer.diskStorage({
    destination: 'uploads/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});

const upload = multer({
    storage: storage
});

// admin login

router.post('/Login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ code: 400, message: 'Email and password are required' });
    }
    pool().getConnection((err, connection) => {
        if (err) {
            return res.status(422).json({ status: 'fail', error: err });
        }
        connection.query('SELECT * FROM admin WHERE email = ?', [email], (err, results) => {
            if (err) throw err;
            if (!results.length === 0) {
                return res.status(404).json({ code: 404, message: 'User not found' });
            }
            const admin = results[0];
            if (password != admin.password) {
                return res.status(401).json({ code: 401, message: 'Incorrect password' });
            }
            const token = uuidv4(email); // uuidv4 token
            const otp = Math.floor(1000 + Math.random() * 900000);
            connection.query('UPDATE admin SET token  = ?, otp = ? WHERE email = ?', [token, otp, email], (err) => {
                if (err) throw err;
                res.json({ code: 200, message: 'OTP Send successfully', data: { token } });
            });
        });
    });
});



// admin OTP verification
router.post('/otp-verification', (req, res) => {
    const { otp, token } = req.body;
    if (!otp || !token) {
        return res.status(400).json({ code: 400, message: 'OTP and token are required' });
    }
    pool().getConnection((err, connection) => {
        if (err) {
            return res.status(422).json({ status: 'fail', error: err });
        }
        connection.query('SELECT * FROM admin WHERE token = ?', [token], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.status(404).json({ code: 404, message: 'admin not found' });
            }
            const { id } = results[0];
            const { email } = results[0];
            const oldotp = results[0].otp;
            if (otp != oldotp) {
                return res.status(401).json({ code: 401, message: 'Incorrect OTP' });
            }
            const token = jwt.sign({ id: id }, JWT_KEYS)
            res.json({ code: 200, message: 'login successfully', data: { token, email } });
        });
    });
});


// router.post('/otpverify', (req, res) => {
//     var { otp, mobile } = req.body
//     pool().getConnection(async function (err, connection) {
//         if (err) {
//             connection.release();
//             return res.status(422).json({ status: "fail", error: err })
//         }
//         connection.query('SELECT unique_id, otp FROM users WHERE users.mobile = ?', [mobile], (err, saveduser) => {
//             if (err) {
//                 connection.release();
//                 return res.status(422).json({ status: "fail", error: err })
//             }
//             if (saveduser.length === 0) {
//                 connection.release();
//                 return res.status(422).json({ status: "fail", message: "INVALID Phone number" })
//             }
//             var usersid = saveduser[0].unique_id
//             const users_otp = saveduser[0].otp;
//             if (users_otp === otp) {
//                 const token = jwt.sign({ id: usersid }, 'hello')
//                 connection.release();
//                 return res.json({ status: "success", message: "OTP verified", token: token })
//             } else {
//                 return res.status(422).json({ status: "fail", message: "INVALID OTP" })
//             }
//         })
//     })
// })

// router.post('/user-profile', verifyToken, upload.single('photo'), (req, res) => {
//     // Get the form data
//     const { unique_id } = req.users;
//     console.log("unique_id", unique_id)
//     const { email, mobile, address, state, city, postalCode, whatsappNumber } = req.body;
//     const photo = req.file.filename;
//     pool().getConnection(async function (err, connection) {
//         if (err) {
//             connection.release();
//             return res.status(422).json({ status: "fail", error: err })
//         }
//         const createUserQuery = 'INSERT INTO profile (unique_id, email,	mobile,	address, state,	city, postalCode, whatsappNumber, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
//         connection.query(createUserQuery, [unique_id, email, mobile, address, state, city, postalCode, whatsappNumber, photo], (err, result) => {
//             if (err) {
//                 console.error('Error creating user:', err);
//                 res.status(500).json({ error: 'Failed to signup' });
//             } else {
//                 res.status(201).json({ status: "success", statusCode: '01', message: 'User profile created successfully' });
//             }
//         })
//     });
// }
// );



// dummy register api

// router.get('/register', (req, res) => {
//     pool().getConnection((err, connection) => {
//         if (err) {
//             return res.status(422).json({ status: 'fail', error: err });
//         }
//         const createUserQuery = 'INSERT INTO admin (email, password, token, otp) VALUES (?, ?, ?, ?)';
//         connection.query(createUserQuery, ["admin@gmail.com", "admin@123", "1234455", "123456"], (err, result) => {
//             if (err) {
//                 console.error('Error creating user:', err);
//                 res.status(500).json({ error: 'Failed to signup' });
//             } else {
//                 res.status(201).json({ status: "success", statusCode: '01', message: 'OTP send successfully' });
//             }
//         });

//     });
// });






module.exports = router;