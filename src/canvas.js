import {makePerspectiveMatrix,clearScreen,draw} from './gl-utils.js';

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

}

export {main};