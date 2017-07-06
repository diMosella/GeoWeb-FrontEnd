// We only need to import the modules necessary for initial render
import BaseLayout from '../layouts/BaseLayout'
import HomeRoute from './HomeRoute'
import ChecklistRoute from './ChecklistRoute'
import ProductsRoute from './ProductsRoute'
import ReportsAndLogsRoute from './ReportsAndLogsRoute'
import MonitoringAndTriggersRoute from './MonitoringAndTriggersRoute'
import FullScreenRoute from './FullScreenRoute'
import FileNotFoundRoute from './FileNotFoundRoute'
import ManagementRoute from './ManagementRoute'

/*  Note: Instead of using JSX, we recommend using react-router
    PlainRoute objects to build route definitions.   */

export const createRoutes = (store) => ({
  path: '/',
  component: BaseLayout,
  indexRoute: HomeRoute(store),
  childRoutes: [
    ChecklistRoute(),
    ProductsRoute(),
    ReportsAndLogsRoute(),
    MonitoringAndTriggersRoute(),
    FullScreenRoute(),
    ManagementRoute(),
    FileNotFoundRoute()
  ]
})

export default createRoutes
