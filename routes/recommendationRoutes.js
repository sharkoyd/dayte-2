const express = require('express');
const recommendationController = require('../controllers/recommendation');
const auth = require('../middleware/auth');

const router = express.Router();

// Route to create a new recommendation
router.post('/generate',auth,recommendationController.createRecommendation);

// Route to get all recommendations
router.get('/',auth, recommendationController.getRecommendations);

module.exports = router;