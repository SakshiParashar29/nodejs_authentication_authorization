const authMiddleware = require("../middleware/auth.middleware");

const express = require('express');
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

router.get('/check', authMiddleware, (req, res) => {
    const user = req.user;

    return res.json({
        user: user
    });
});
router.get('/role', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const user = req.user;

    return res.json({
        name: user.name
    });
});

module.exports = router;