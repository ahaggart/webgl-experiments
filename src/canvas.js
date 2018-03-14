import {makePerspectiveMatrix,clearScreen,draw} from './gl-utils.js';
import {BasicShader} from './shaders.js';
import {BasicQuad} from './BasicQuad.js';
import {mat4,vec4} from 'gl-matrix';

function main(){
  console.log("Starting WegGL canvas setup...");
  //get the canvas and the webgl context
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (!gl) {
    console.error("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  //set up one-time webgl stuff
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  clearScreen(gl);

  const projection = makePerspectiveMatrix(gl);

  const shader = new BasicShader(gl); //create a basic shader

  const quad = new BasicQuad([1,1],[0,0,-5]);

  shader.build(quad);

  shader.use(gl);

  draw(gl,shader,[quad],projection);

}

export {main};