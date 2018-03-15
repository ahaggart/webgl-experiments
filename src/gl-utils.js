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
      if(this.locations.attributes[name] == -1){
        console.error("Error adding Attribute: "+name+"; please check identifier: "+identifier);
        console.error(gl.getProgramInfoLog(this.program));
      }
    },
    addUniform:function(name,identifier){
      this.locations.uniforms[name] = gl.getUniformLocation(this.program,identifier);
      if(this.locations.uniforms[name] == null){
        console.error("Error adding Uniform: "+name+"; please check identifier.");
      }
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

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


export {
  makePerspectiveMatrix,
  initShaderProgram,
  initProgramInfo,
  clearScreen,
  draw,
  createAndBindBuffer,
  enableVertexFloatArrayBuffer,
  loadTexture
};