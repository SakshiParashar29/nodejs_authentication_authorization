const authMiddleware = require("../middleware/auth.middleware");

const express = require('express');

const router = express.Router();

router.get('/check', authMiddleware, (req, res) => {
    const user = req.user;

    return res.json({
        user: user
    });
});

module.exports = router;