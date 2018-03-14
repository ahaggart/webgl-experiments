/**
 * gl-utils.js: utility functions for operating on a WebGL canvas
 *
 * pretty much everything here takes a gl context as first argument
 * 
 * Author: Alex Haggart
 */

import {mat4} from 'gl-matrix';

function makePerspectiveMatrix(gl){
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  return projectionMatrix;
}

function clearScreen(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * draw a list of draw()-able objects by setting up uniforms and 
 * passing the context to the objects
 * 
 * @param gl WebGL context
 * @param programInfo object created by createProgramInfo containing information
 *                      important for interacting with OpenGL bindings
 * @param drawList  list of objects with a draw(gl) attribute
 * @param projection  projection matrix ie [[4][4][4][4]] list of four (lists of size four)
 */
function draw(gl,shader,drawList,projectionMatrix){
  // Set the shader uniforms
  gl.uniformMatrix4fv(
      shader.programInfo.locations.uniforms.projection,
      false,
      projectionMatrix);

  drawList.forEach((obj)=>obj.draw(gl));
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//no geometry shaders :(
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//create an empty programInfo object, scaffolding for custom shader program 
//wrappers to use
function initProgramInfo(gl){
  return {
    gl:gl, //grab the gl context
    program:null,
    locations:{
      uniforms:{},
      attributes:{},
    },
    addAttribute:function(name,identifier){
      this.locations.attributes[name] = gl.getAttribLocation(this.program,identifier);
    },
    addUniform:function(name,identifier){
      this.locations.uniforms[name] = gl.getUniformLocation(this.program,identifier);
    },
    setProgram:function(program){
      this.program = program;
    },
  };
}

function createAndBindBuffer(gl,type,data,usage){
  const buffer = gl.createBuffer();
  gl.bindBuffer(type,buffer);
  gl.bufferData(type,data,usage);
  return buffer;
}

function enableVertexFloatArrayBuffer(gl,buffer,position,indexSize){
  const numComponents = indexSize;  // number of values per iteration
  const type = gl.FLOAT;    // the data in the buffer is 32bit floats
  const normalize = false;  // don't normalize
  const stride = 0;         // how many bytes to get from one set of values to the next
                            // 0 = use type and numComponents above
  const offset = 0;         // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
      position,
      numComponents,
      type,
      normalize,
      stride,
      offset);
  gl.enableVertexAttribArray(
      position);
}


export {
  makePerspectiveMatrix,
  initShaderProgram,
  initProgramInfo,
  clearScreen,
  draw,
  createAndBindBuffer,
  enableVertexFloatArrayBuffer
};