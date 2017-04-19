import React from 'react';
import PropTypes from 'prop-types';
import AdagucMapDraw from './AdagucMapDraw.js';
import AdagucMeasureDistance from './AdagucMeasureDistance.js';
import axios from 'axios';
import ModelTime from './ModelTime';
import $ from 'jquery';
import { BACKEND_SERVER_URL, BACKEND_SERVER_XML2JSON } from '../../constants/backend';
var moment = require('moment');
var elementResizeEvent = require('element-resize-event');

export default class Adaguc extends React.Component {
  constructor () {
    super();
    this.initAdaguc = this.initAdaguc.bind(this);
    this.resize = this.resize.bind(this);
    this.updateLayer = this.updateLayer.bind(this);
    this.onChangeAnimation = this.onChangeAnimation.bind(this);
    this.timeHandler = this.timeHandler.bind(this);
    this.updateBBOX = this.updateBBOX.bind(this);
    this.isAnimating = false;
    this.state = {
      dropdownOpenView: false,
      modal: false,
      activeTab: '1',
      inSigmetModus: false,
      time: undefined
    };
    this.toggleView = this.toggleView.bind(this);
    this.progtempLocations = [
      {
        name: 'EHAM',
        x: 4.77,
        y: 52.30
      }, {
        name: 'EHRD',
        x: 4.42,
        y: 51.95
      }, {
        name: 'EHTW',
        x: 6.98,
        y: 52.28
      }, {
        name: 'EHBK',
        x: 5.76,
        y: 50.95
      }, {
        name: 'EHFS',
        x: 3.68,
        y: 51.46
      }, {
        name: 'EHDB',
        x: 5.18,
        y: 52.12
      }, {
        name: 'EHGG',
        x: 6.57,
        y: 53.10
      }, {
        name: 'EHKD',
        x: 4.74,
        y: 52.93
      }, {
        name: 'EHAK',
        x: 3.81,
        y: 55.399
      }, {
        name: 'EHDV',
        x: 2.28,
        y: 53.36
      }, {
        name: 'EHFZ',
        x: 3.94,
        y: 54.12
      }, {
        name: 'EHFD',
        x: 4.67,
        y: 54.83
      }, {
        name: 'EHHW',
        x: 6.04,
        y: 52.037
      }, {
        name: 'EHKV',
        x: 3.68,
        y: 53.23
      }, {
        name: 'EHMG',
        x: 4.93,
        y: 53.63
      }, {
        name: 'EHMA',
        x: 5.94,
        y: 53.54
      }, {
        name: 'EHQE',
        x: 4.15,
        y: 52.92
      }, {
        name: 'EHPG',
        x: 3.3416,
        y: 52.36
      }
    ];
  }

  currentLatestDate = undefined;
  currentBeginDate = undefined;
  /* istanbul ignore next */
  updateLayer (layer) {
    this.webMapJS.setAnimationDelay(200);
    if (!layer) {
      return;
    }
    this.webMapJS.stopAnimating();
    if (this.props.active) {
      this.props.dispatch(this.props.actions.setWMJSLayers({ layers: this.webMapJS.getLayers(), baselayers: this.webMapJS.getBaseLayers() }));
    }
    layer.onReady = undefined;
    if (layer.getDimension('reference_time')) {
      layer.setDimension('reference_time', layer.getDimension('reference_time').getValueForIndex(layer.getDimension('reference_time').size() - 1), false);
    }

    if (this.isAnimating) {
      this.webMapJS.drawAutomatic(moment().utc().subtract(4, 'hours'), moment().utc().add(48, 'hours'));
    } else {
      const { adagucProperties } = this.props;
      if (adagucProperties.timedim) {
        this.webMapJS.setDimension('time', adagucProperties.timedim, true);
      }
      this.webMapJS.draw();
    }

    setTimeout(function () { layer.parseLayer(this.updateLayer, true); }, 10000);
  }
  timeHandler () {
    const wmjstime = this.webMapJS.getDimension('time').currentValue;
    if (!this.prevTime) {
      this.prevTime = wmjstime;
    }
    if (wmjstime !== this.prevTime) {
      this.prevTime = wmjstime;
      if (this.props.active) {
        this.props.dispatch(this.props.actions.setTimeDimension(wmjstime));
      }
    }
  }
  /* istanbul ignore next */
  resize () {
    var element = document.querySelector('#adagucwrapper' + this.props.mapId).parentNode;
    this.webMapJS.setSize($(element).width(), $(element).height());
    this.webMapJS.draw();
  }
  updateBBOX () {
    const { dispatch, actions } = this.props;
    const bbox = this.webMapJS.getBBOX();
    dispatch(actions.setCut({ title: 'Custom', bbox: [bbox.left, bbox.bottom, bbox.right, bbox.top] }));
  }
  /* istanbul ignore next */
  initAdaguc (adagucMapRef) {
    const { adagucProperties, actions, dispatch } = this.props;
    if (adagucProperties.mapCreated) {
      return;
    }
    localStorage.setItem('geoweb', JSON.stringify({ 'personal_urls': [] }));
    // eslint-disable-next-line no-undef
    this.webMapJS = new WMJSMap(adagucMapRef, BACKEND_SERVER_XML2JSON);
    let element = document.querySelector('#adagucwrapper' + this.props.mapId);
    if (!element) {
      return;
    }
    element = element.parentNode;
    const width = $(element).width();
    const height = $(element).height();
    this.webMapJS.setSize(width, height);
    elementResizeEvent(element, this.resize);

    // Set the initial projection
    this.webMapJS.setProjection(adagucProperties.projectionName);
    this.webMapJS.setBBOX(adagucProperties.boundingBox.bbox.join());
    this.webMapJS.addListener('onscroll', this.updateBBOX, true);
    this.webMapJS.addListener('mapdragend', this.updateBBOX, true);

    // eslint-disable-next-line no-undef
    this.webMapJS.setBaseLayers([new WMJSLayer(adagucProperties.layers.baselayer)]);
    const defaultURLs = ['getServices', 'getOverlayServices'].map((url) => BACKEND_SERVER_URL + '/' + url);
    const allURLs = [...defaultURLs];
    axios.all(allURLs.map((req) => axios.get(req, { withCredentials: true }))).then(
      axios.spread((services, overlays) => dispatch(actions.createMap([...services.data, ...JSON.parse(localStorage.getItem('geoweb')).personal_urls], overlays.data[0])))
    );
    this.webMapJS.stopAnimating();
    const newDatalayers = adagucProperties.layers.panel[this.props.mapId].datalayers.map((datalayer) => {
      // eslint-disable-next-line no-undef
      const newDataLayer = new WMJSLayer(datalayer);
      newDataLayer.setAutoUpdate(true, moment.duration(2, 'minutes').asMilliseconds(), this.updateLayer);
      newDataLayer.onReady = this.updateLayer;
      return newDataLayer;
    });
    this.webMapJS.removeAllLayers();
    newDatalayers.reverse().forEach((layer) => this.webMapJS.addLayer(layer));
    const newActiveLayer = (this.webMapJS.getLayers()[0]);
    this.webMapJS.addListener('ondimchange', this.timeHandler, true);
    if (newActiveLayer) {
      this.webMapJS.setActiveLayer(this.webMapJS.getLayers()[0]);
    }
    // eslint-disable-next-line no-undef
    const currentDate = getCurrentDateIso8601();
    if (this.props.active) {
      dispatch(actions.setTimeDimension(currentDate.toISO8601()));
      dispatch(actions.setWMJSLayers({ layers: this.webMapJS.getLayers(), baselayers: this.webMapJS.getBaseLayers() }));
    }
    this.webMapJS.draw();
  }

  componentDidMount () {
    this.initAdaguc(this.refs.adaguc);
  }
  componentWillMount () {
    /* Component will unmount, set flag that map is not created */
    const { adagucProperties } = this.props;
    adagucProperties.mapCreated = false;
  }
  componentWillUnmount () {
    if (this.webMapJS) {
      this.webMapJS.destroy();
    }
  }
  orderChanged (currLayers, prevLayers) {
    if (currLayers.length !== prevLayers.length) {
      return true;
    }
    for (var i = currLayers.length - 1; i >= 0; i--) {
      if (currLayers[i].service !== prevLayers[i].service || currLayers[i].name !== prevLayers[i].name) {
        return true;
      }
    }
    return false;
  }
  findClosestCursorLoc (event) {
    // Find the latlong from the pixel coordinate
    const latlong = this.webMapJS.getLatLongFromPixelCoord({ x: event.x, y: event.y });
    this.props.dispatch(this.props.actions.cursorLocation(latlong));
  }

  updateBoundingBox (boundingBox, prevBoundingBox) {
    if (boundingBox !== prevBoundingBox) {
      // eslint-disable-next-line no-undef
      this.webMapJS.setBBOX(boundingBox.bbox.join());
    }
  }

  updateTime (timedim, prevTime) {
    if (timedim !== prevTime) {
      // eslint-disable-next-line no-undef
      this.webMapJS.setDimension('time', timedim, true);
    }
  }

  updateMapMode (mapMode, prevMapMode, active) {
    // Update mapmode
    if (mapMode !== prevMapMode) {
      // Remove listeners if switching away from progtemp or timeseries
      if ((prevMapMode === 'progtemp' && mapMode !== 'progtemp') ||
          (prevMapMode === 'timeseries' && mapMode !== 'timeseries')) {
        this.webMapJS.removeListener('mouseclicked');
        this.webMapJS.enableInlineGetFeatureInfo(true);
      }

      // Register listeners if switching to progtemp or timeseries
      if ((prevMapMode !== 'progtemp' && mapMode === 'progtemp') ||
          (prevMapMode !== 'timeseries' && mapMode === 'timeseries')) {
        this.webMapJS.enableInlineGetFeatureInfo(false);
        this.webMapJS.addListener('mouseclicked', (e) => this.findClosestCursorLoc(e), true);
      }
      switch (mapMode) {
        case 'zoom':
          this.webMapJS.setMapModeZoomBoxIn();
          break;
        case 'progtemp':
        case 'timeseries':
        case 'pan':
          this.webMapJS.setMapModePan();
          break;
        case 'draw':
          if (active) {
            this.webMapJS.setMessage('Press [Esc] to close the polygon.');
          }
          break;
        case 'measure':
          if (active) {
            this.webMapJS.setMessage('Click to end measuring. Press [Esc] to delete the measurement.');
          }
          break;
        default:
          this.webMapJS.setMapModeNone();
          break;
      }
      if (!active || !(mapMode === 'draw' || mapMode === 'measure')) {
        this.webMapJS.setMessage('');
      }
    }
  }

  // Returns true when the layers are actually different w.r.t. previous layers, otherwise false
  updateBaselayers (baselayer, prevBaselayer, overlays, prevOverlays) {
    if (baselayer !== prevBaselayer || overlays !== prevOverlays) {
        // eslint-disable-next-line no-undef
      const baseLayer = new WMJSLayer(baselayer);
      const overlayers = overlays.map((overlay) => {
        // eslint-disable-next-line no-undef
        const newOverlay = new WMJSLayer(overlay);
        newOverlay.keepOnTop = true;
        return newOverlay;
      });
      // eslint-disable-next-line no-undef
      const newBaselayers = [baseLayer].concat(overlayers);
      this.webMapJS.setBaseLayers(newBaselayers);

      return true;
    }
    return false;
  }

  // Returns true when the layers are actually different w.r.t. previous layers, otherwise false
  updateLayers (currDataLayers, prevDataLayers) {
    if (currDataLayers !== prevDataLayers) {
      if (this.orderChanged(currDataLayers, prevDataLayers)) {
        this.webMapJS.stopAnimating();
        const newDatalayers = currDataLayers.map((datalayer) => {
          // eslint-disable-next-line no-undef
          const newDataLayer = new WMJSLayer(datalayer);
          newDataLayer.setAutoUpdate(true, moment.duration(2, 'minutes').asMilliseconds(), this.updateLayer);
          newDataLayer.onReady = this.updateLayer;
          return newDataLayer;
        });
        this.webMapJS.removeAllLayers();
        newDatalayers.reverse().forEach((layer) => this.webMapJS.addLayer(layer));
      } else {
        const layers = this.webMapJS.getLayers();
        for (var i = layers.length - 1; i >= 0; i--) {
          layers[i].enabled = currDataLayers[i].enabled;
          layers[i].opacity = currDataLayers[i].opacity;
          layers[i].service = currDataLayers[i].service;
          layers[i].name = currDataLayers[i].name;
          layers[i].label = currDataLayers[i].label;
          if (currDataLayers[i].style) {
            layers[i].currentStyle = currDataLayers[i].style;
          }
          this.webMapJS.getListener().triggerEvent('onmapdimupdate');
        }
      }
      return true;
    }
    return false;
  }

  /* istanbul ignore next */
  componentDidUpdate (prevProps, prevState) {
    // The first time, the map needs to be created. This is when in the previous state the map creation boolean is false
    // Otherwise only change when a new dataset is selected
    const { adagucProperties, mapId, active, dispatch, actions } = this.props;
    const { layers, boundingBox, timedim, animate, mapMode, cursor } = adagucProperties;
    const prevAdagucProperties = prevProps.adagucProperties;

    // Updates that need to happen across all panels
    this.updateBoundingBox(boundingBox, prevAdagucProperties.boundingBox);
    this.updateTime(timedim, prevAdagucProperties.timedim);
    this.updateMapMode(mapMode, prevAdagucProperties.mapMode, active);

    // Update animation -- animate iff animate is set and the panel is active.
    this.onChangeAnimation(active && animate);

    // Track cursor if necessary
    if (cursor && cursor.location && cursor !== prevProps.adagucProperties.cursor) {
      this.webMapJS.positionMapPinByLatLon({ x: cursor.location.x, y: cursor.location.y });
    }

    const baselayer = layers.baselayer;
    const prevBaselayer = prevAdagucProperties.layers.baselayer;
    const overlays = layers.panel[mapId].overlays;
    const prevOverlays = prevAdagucProperties.layers.panel[mapId].overlays;
    const baseChanged = this.updateBaselayers(baselayer, prevBaselayer, overlays, prevOverlays);
    const layersChanged = this.updateLayers(layers.panel[mapId].datalayers, prevAdagucProperties.layers.panel[mapId].datalayers);

    // Set the current layers if the panel becomes active (necessary for the layermanager etc.)
    if (active) {
      console.log(baseChanged);
      console.log(layersChanged);
    }
    if (active && (baseChanged || layersChanged)) {
      console.log(this.webMapJS.getBaseLayers());
      dispatch(actions.setWMJSLayers({ layers: this.webMapJS.getLayers(), baselayers: this.webMapJS.getBaseLayers() }));
    }
    this.webMapJS.draw();
  }

  /* istanbul ignore next */
  onChangeAnimation (value) {
    this.isAnimating = value && this.props.active;
    if (this.isAnimating) {
      this.webMapJS.drawAutomatic(moment().utc().subtract(4, 'hours'), moment().utc().add(48, 'hours'));
    } else {
      this.webMapJS.stopAnimating();
    }
  };
  toggleView () {
    this.setState({
      dropdownOpenView: !this.state.dropdownOpenView
    });
  }
  render () {
    const { adagucProperties, dispatch, mapId, actions } = this.props;
    return (
      <div id={'adagucwrapper' + mapId}>
        <div ref='adaguc' />
        <div style={{ margin: '5px 10px 10px 5px ' }}>
          <AdagucMapDraw
            actions={actions}
            geojson={adagucProperties.adagucmapdraw.geojson}
            dispatch={dispatch}
            isInEditMode={adagucProperties.mapMode === 'draw' || adagucProperties.mapMode === 'delete'}
            isInDeleteMode={adagucProperties.mapMode === 'delete'}
            webmapjs={this.webMapJS} />
          <AdagucMeasureDistance
            dispatch={dispatch}
            webmapjs={this.webMapJS}
            isInEditMode={adagucProperties.mapMode === 'measure'} />
          <ModelTime webmapjs={this.webMapJS} active={this.props.active} />
        </div>
      </div>
    );
  }
}

Adaguc.propTypes = {
  adagucProperties : PropTypes.object.isRequired,
  actions          : PropTypes.object.isRequired,
  dispatch         : PropTypes.func.isRequired,
  mapId            : PropTypes.number.isRequired,
  active           : PropTypes.bool.isRequired
};
