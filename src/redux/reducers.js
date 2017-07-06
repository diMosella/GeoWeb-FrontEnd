import {combineReducers} from 'redux'
import {reducer as notificationsReducer} from 'reapop'
import recentTriggerReducer from './modules/recentTriggerReducer'
import adagucReducer from './modules/adagucReducer'
import mapReducer from './modules/mapReducer'
import userReducer from './modules/userReducer'
import layerReducer from './modules/layerReducer'
import drawReducer from './modules/drawReducer'

export const makeRootReducer = () => {
  return combineReducers({
    adagucProperties: adagucReducer,
    drawProperties: drawReducer,
    mapProperties: mapReducer,
    userProperties: userReducer,
    layers: layerReducer,
    recentTriggers: recentTriggerReducer,
    notifications: notificationsReducer()
  })
}
export default makeRootReducer
