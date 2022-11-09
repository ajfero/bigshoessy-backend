const express = require('express')
const router = express.Router()

/* CONTROLLERS */
const { isAuthenticated } = require('../controllers/auth.controller');
const { getAllProfile, getProfile, updateProfile, isExistProfile } = require('../controllers/profile.controller'); // profileController

/* VALIDATOR */
// const { validateProfile } = require('../validators/profile');

/* CRUD PROFILE USER */
router.get('/', isAuthenticated, getAllProfile); // READ one user. http://localhost:3000/api/user/profile
router.get('/:id', isExistProfile, isAuthenticated, getProfile); // READ one user. http://localhost:3000/api/user/profile/:id
router.patch('/:id', isExistProfile, isAuthenticated, updateProfile); // UPDATE one user. http://localhost:3000/api/user/profile/:id

/* OTHERS ENDPOINT */
// router.post('/', isExist, isAuthenticat0ed, create); // CREATE one user. http://localhost:3000/api/users/
// router.get('/:id', isExist, isAuthenticated, find); // READ one user. http://localhost:3000/api/users/:id
// router.delete('/:id', isExist, isAuthenticated, delete); // DELETE one user. http://localhost:3000/api/users/:id

module.exports = router