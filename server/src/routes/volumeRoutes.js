const express = require('express');
const volumeController = require('../controllers/volumeController');

const router = express.Router();

router.route('/')
  .get(volumeController.getAllVolumes)
  .post(volumeController.createVolume);

router.route('/:id')
  .get(volumeController.getVolumeById)
  .put(volumeController.updateVolume)
  .delete(volumeController.deleteVolume);

router.route('/series/:seriesId')
  .get(volumeController.getVolumesBySeries);

module.exports = router;