// @flow
import vocabularyService from 'services/vocabulary-service'

const usCoords = { latitude: 40.75764768718219, longitude: -73.98578582987093 } //TIMES SQUARE, NY
const auCoords = {
  latitude: -33.861146727854496,
  longitude: 151.20863228242192,
} //CIRCULAR QUAY, SYDNEY
const coords = vocabularyService.locale === 'en-US' ? usCoords : auCoords

export default coords
