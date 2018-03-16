import {makePerspectiveMatrix,clearScreen,draw,getFacing} from './gl-utils.js';
import {BasicShader,DiffuseShader,DiffuseTexturedShader} from './shaders.js';
import {Voxel} from './Voxel.js';
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

  const shader = new DiffuseTexturedShader(gl); //create a basic shader

  // const quad = new BasicQuad([1,1],[0,0,-5]);
  const voxel = new Voxel(1,[0,0,-5]);

  shader.build(voxel);

  shader.use(gl);

  const vertices = [
    -0.5,-0.5,0.5, //front face
     0.5,-0.5,0.5,
     0.5, 0.5,0.5,
    -0.5, 0.5,0.5,

     0.5,-0.5,-0.5, //back face
    -0.5,-0.5,-0.5,
    -0.5, 0.5,-0.5,
     0.5, 0.5,-0.5,
  ];
  const indices = [
    0,1,2,2,3,0, //front face
    4,5,6,6,7,4, //back face
    1,4,7,7,2,1, //right
    5,0,3,3,6,5, //left
    3,2,7,7,6,3, //top
    5,4,1,1,0,5, //bottom
  ];

  const towardsView = (dot)=>(dot > 0);
  const facing = getFacing(towardsView,[0,0,0],vertices,indices,voxel.transform);
  console.log(facing);

  const awayFromView = (dot)=>(dot <= 0);
  const away = getFacing(awayFromView,[0,0,0],vertices,indices,voxel.transform);
  console.log(away);

  const edge = [...(facing.values())].filter((index)=>away.has(index));
  console.log(edge);

  window.setInterval(()=>{
    clearScreen(gl);
    draw(gl,shader,[voxel],projection);
  },100);

}

export {main};