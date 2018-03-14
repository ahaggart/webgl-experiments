import {initProgramInfo,initShaderProgram} from './gl-utils.js';

import vsSource from './basic-vertex-shader.vs';
import fsSource from './basic-frag-shader.fs';

class BasicShader{
  constructor(gl){
    this.programInfo = initProgramInfo(gl);

    const program = initShaderProgram(gl,vsSource,fsSource);
    this.programInfo.setProgram(program);

    this.programInfo.addUniform('modelView','uModelViewMatrix');
    this.programInfo.addUniform('projection','uProjectionMatrix');

    this.programInfo.addAttribute('color',    'aColor');
    this.programInfo.addAttribute('normal',   'aNormal');
    this.programInfo.addAttribute('position', 'aPosition');
  }

  getInfo(){
    return this.programInfo;
  }

  //build an object for drawing with this shader
  build(buildable){
    //include gl as its own argument
    buildable.build(this.programInfo.gl,this.programInfo);
  }

  use(gl,mode="full"){ //ignore the mode argument for a basic shader
    gl.useProgram(this.programInfo.program);
    // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);

    //more advanced shaders would set up their own uniforms here, but we dont
    //have anything special to set up
  }
};

export {BasicShader};