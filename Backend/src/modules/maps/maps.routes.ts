import { Router } from 'express';
import {
  autocompleteController,
  placeDetailsController,
  geocodeController,
  reverseGeocodeController,
  distanceController,
} from './maps.controller';

const router = Router();

// Public / Authenticated map helper routes
router.get('/autocomplete', autocompleteController);
router.get('/place-details', placeDetailsController);
router.get('/geocode', geocodeController);
router.get('/reverse-geocode', reverseGeocodeController);
router.get('/distance', distanceController);

export default router;
