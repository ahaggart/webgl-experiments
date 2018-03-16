/**
 * buildable.js: base class for recursive drawable object hierarchies
 * 
 * Author: Alex Haggart
 */
class Buildable{
  constructor(){
    this.data = {};
    this.buffers = {};
    this.positions = {
      uniforms:{},
      attributes:{},
    };
  }
}

export {Buildable};