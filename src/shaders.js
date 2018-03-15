/**
 * shaders.js: a few basic shaders that build off one another
 * planned: Phong shader, Gooch shader, shadow volume shading
 * 
 * Author: Alex Haggart
 */
import {initProgramInfo,initShaderProgram} from './gl-utils.js';

import vsBasic from './shaders/basic-vertex-shader.vs';
import fsBasic from './shaders/basic-frag-shader.fs';
import fsDiffuse from './shaders/diffuse-frag-shader.fs';
import fsDiffuseTextured from './shaders/diffuse-textured-frag-shader.fs';
import fsBlinnPhong from './shaders/blinn-phong-frag-shader.fs';

class BasicShader{
  constructor(gl,vs=vsBasic,fs=fsBasic){
    this.programInfo = initProgramInfo(gl);

    const program = initShaderProgram(gl,vs,fs);
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
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);

    //more advanced shaders would set up their own uniforms here, but we dont
    //have anything special to set up    
  }
};

class DiffuseShader extends BasicShader{
  constructor(gl,vs=vsBasic,fs=fsDiffuse){
    super(gl,vs,fs);

    //add uniforms not added by basic shader
    this.programInfo.addUniform('lightPosition','uLightPosition');
    this.programInfo.addUniform('ambientLight','uAmbientLight');

    this.lightPosition = [5, 0, 0];
    this.ambientIntensity = [0.2, 0.2, 0.2];
  }

  use(gl,mode="full"){
    super.use(gl,mode);
    gl.uniform3f(
        this.programInfo.locations.uniforms.lightPosition,
        this.lightPosition[0],this.lightPosition[1],this.lightPosition[2]);
    gl.uniform3f(
        this.programInfo.locations.uniforms.ambientLight,
        this.ambientIntensity[0],this.ambientIntensity[1],this.ambientIntensity[2]);
  }
}

class BlinnPhongShader extends DiffuseShader{
  constructor(gl,vs=vsBasic,fs=fsBlinnPhong){
    super(gl,vs,fs);
  }
}

export {BasicShader,DiffuseShader};