const express = require('express');
const seriesController = require('../controllers/seriesController');

const router = express.Router();

router.route('/')
  .get(seriesController.getAllSeries)
  .post(seriesController.createSeries);

router.route('/:id')
  .get(seriesController.getSeriesById)
  .put(seriesController.updateSeries)
  .delete(seriesController.deleteSeries);

module.exports = router;