import { Util, Collection } from './Util';
import { Container } from './Container';
import { Node } from './Node';
import { Factory } from './Factory';
import { SceneCanvas, HitCanvas } from './Canvas';
import { Stage } from './Stage';

import { GetSet } from './types';

/**
 * BaseLayer constructor.
 * @constructor
 * @memberof Konva
 * @augments Konva.Container
 * @param {Object} config
 * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
 * to clear the canvas before each layer draw.  The default value is true.
 * @@nodeParams
 * @@containerParams
 */
export abstract class BaseLayer extends Container {
  canvas: SceneCanvas;
  hitCanvas: HitCanvas;

  constructor(config) {
    super(config);
    this.nodeType = 'Layer';
    this.canvas = new SceneCanvas();

    this.on('visibleChange', this._checkVisibility);
    this._checkVisibility();
  }
  // for nodejs?
  createPNGStream() {
    const c = this.canvas._canvas as any;
    return c.createPNGStream();
  }
  /**
   * get layer canvas
   * @method
   * @memberof Konva.BaseLayer.prototype
   */
  getCanvas() {
    return this.canvas;
  }
  /**
   * get layer hit canvas
   * @method
   * @memberof Konva.BaseLayer.prototype
   */
  getHitCanvas() {
    return this.hitCanvas;
  }
  /**
   * get layer canvas context
   * @method
   * @memberof Konva.BaseLayer.prototype
   */
  getContext() {
    return this.getCanvas().getContext();
  }
  /**
   * clear scene and hit canvas contexts tied to the layer
   * @method
   * @memberof Konva.BaseLayer.prototype
   * @param {Object} [bounds]
   * @param {Number} [bounds.x]
   * @param {Number} [bounds.y]
   * @param {Number} [bounds.width]
   * @param {Number} [bounds.height]
   * @example
   * layer.clear();
   * layer.clear({
   *   x : 0,
   *   y : 0,
   *   width : 100,
   *   height : 100
   * });
   */
  clear(bounds?) {
    this.getContext().clear(bounds);
    return this;
  }
  // extend Node.prototype.setZIndex
  setZIndex(index) {
    Node.prototype.setZIndex.call(this, index);
    var stage = this.getStage();
    if (stage) {
      stage.content.removeChild(this.getCanvas()._canvas);

      if (index < stage.getChildren().length - 1) {
        stage.content.insertBefore(
          this.getCanvas()._canvas,
          stage.getChildren()[index + 1].getCanvas()._canvas
        );
      } else {
        stage.content.appendChild(this.getCanvas()._canvas);
      }
    }
    return this;
  }
  moveToTop() {
    Node.prototype.moveToTop.call(this);
    var stage = this.getStage();
    if (stage) {
      stage.content.removeChild(this.getCanvas()._canvas);
      stage.content.appendChild(this.getCanvas()._canvas);
    }
    return true;
  }
  moveUp() {
    var moved = Node.prototype.moveUp.call(this);
    if (!moved) {
      return false;
    }
    var stage = this.getStage();
    if (!stage) {
      return false;
    }
    stage.content.removeChild(this.getCanvas()._canvas);

    if (this.index < stage.getChildren().length - 1) {
      stage.content.insertBefore(
        this.getCanvas()._canvas,
        stage.getChildren()[this.index + 1].getCanvas()._canvas
      );
    } else {
      stage.content.appendChild(this.getCanvas()._canvas);
    }
    return true;
  }
  // extend Node.prototype.moveDown
  moveDown() {
    if (Node.prototype.moveDown.call(this)) {
      var stage = this.getStage();
      if (stage) {
        var children = stage.getChildren();
        stage.content.removeChild(this.getCanvas()._canvas);
        stage.content.insertBefore(
          this.getCanvas()._canvas,
          children[this.index + 1].getCanvas()._canvas
        );
      }
      return true;
    }
    return false;
  }
  // extend Node.prototype.moveToBottom
  moveToBottom() {
    if (Node.prototype.moveToBottom.call(this)) {
      var stage = this.getStage();
      if (stage) {
        var children = stage.getChildren();
        stage.content.removeChild(this.getCanvas()._canvas);
        stage.content.insertBefore(
          this.getCanvas()._canvas,
          children[1].getCanvas()._canvas
        );
      }
      return true;
    }
    return false;
  }
  getLayer() {
    return this;
  }
  remove() {
    var _canvas = this.getCanvas()._canvas;

    Node.prototype.remove.call(this);

    if (_canvas && _canvas.parentNode && Util._isInDocument(_canvas)) {
      _canvas.parentNode.removeChild(_canvas);
    }
    return this;
  }
  getStage() {
    return this.parent as Stage;
  }
  setSize({ width, height }) {
    this.canvas.setSize(width, height);
    return this;
  }
  _toKonvaCanvas(config) {
    config = config || {};
    config.width = config.width || this.getWidth();
    config.height = config.height || this.getHeight();
    config.x = config.x !== undefined ? config.x : this.x();
    config.y = config.y !== undefined ? config.y : this.y();

    return Node.prototype._toKonvaCanvas.call(this, config);
  }

  _checkVisibility() {
    const visible = this.visible();
    if (visible) {
      this.canvas._canvas.style.display = 'block';
    } else {
      this.canvas._canvas.style.display = 'none';
    }
  }
  /**
   * get/set width of layer.getter return width of stage. setter doing nothing.
   * if you want change width use `stage.width(value);`
   * @name width
   * @method
   * @memberof Konva.BaseLayer.prototype
   * @returns {Number}
   * @example
   * var width = layer.width();
   */
  getWidth() {
    if (this.parent) {
      return this.parent.getWidth();
    }
  }
  setWidth() {
    Util.warn(
      'Can not change width of layer. Use "stage.width(value)" function instead.'
    );
  }
  /**
   * get/set height of layer.getter return height of stage. setter doing nothing.
   * if you want change height use `stage.height(value);`
   * @name height
   * @method
   * @memberof Konva.BaseLayer.prototype
   * @returns {Number}
   * @example
   * var height = layer.height();
   */
  getHeight() {
    if (this.parent) {
      return this.parent.getHeight();
    }
  }
  setHeight() {
    Util.warn(
      'Can not change height of layer. Use "stage.height(value)" function instead.'
    );
  }
  getIntersection(pos, selector?) {
    return null;
  }
  // the apply transform method is handled by the Layer and FastLayer class
  // because it is up to the layer to decide if an absolute or relative transform
  // should be used
  _applyTransform(shape, context, top) {
    var m = shape.getAbsoluteTransform(top).getMatrix();
    context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  }

  clearBeforeDraw: GetSet<boolean, this>;
  batchDraw: () => void;
}

// add getters and setters
Factory.addGetterSetter(BaseLayer, 'clearBeforeDraw', true);
/**
 * get/set clearBeforeDraw flag which determines if the layer is cleared or not
 *  before drawing
 * @name clearBeforeDraw
 * @method
 * @memberof Konva.BaseLayer.prototype
 * @param {Boolean} clearBeforeDraw
 * @returns {Boolean}
 * @example
 * // get clearBeforeDraw flag
 * var clearBeforeDraw = layer.clearBeforeDraw();
 *
 * // disable clear before draw
 * layer.clearBeforeDraw(false);
 *
 * // enable clear before draw
 * layer.clearBeforeDraw(true);
 */

Collection.mapMethods(BaseLayer);