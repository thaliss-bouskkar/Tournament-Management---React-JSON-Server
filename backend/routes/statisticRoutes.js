const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statisticController');

router.get('/', statisticController.getStatistics);
router.get('/:id', statisticController.getStatisticById);
router.post('/', statisticController.createStatistic);
router.put('/:id', statisticController.updateStatistic);
router.patch('/:id', statisticController.updateStatistic);
router.delete('/:id', statisticController.deleteStatistic);

module.exports = router;
