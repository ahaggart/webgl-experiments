/**
 * gl-utils.js: utility functions for operating on a WebGL canvas
 *
 * pretty much everything here takes a gl context as first argument
 * 
 * Author: Alex Haggart
 */

import {mat4,vec4,vec3} from 'gl-matrix';

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
    expected:{
      uniforms:[],
      attributes:[],
    },
    addAttribute:function(name,identifier){
      let location = gl.getAttribLocation(this.program,identifier);
      if(location == -1){ //improperly loaded attributes are -1
        console.error("Error adding Attribute: "+name+"; please check identifier: "+identifier);
      } else {
        this.locations.attributes[name] = location;
        this.expected.attributes.push(name);
      }
    },
    addUniform:function(name,identifier,isGlobal=false){
      let location = gl.getUniformLocation(this.program,identifier);
      if(location == null){ //improperly loaded uniforms are null
        console.error("Error adding Uniform: "+name+"; please check identifier.");
      } else {
        if(!isGlobal){
          this.expected.uniforms.push(name);
        }
        this.locations.uniforms[name] = location;
      }
    },
    setProgram:function(program){
      this.program = program;
    },
    buildObjectUniforms:function(buildable){
      this.expected.attributes.forEach((attr)=>{
        buildable.positions.uniforms[attr] = this.locations.uniforms[attr];
      });
    },
    buildObjectAttributes:function(buildable){
      this.expected.attributes.forEach((attr)=>{
        buildable.buffers[attr] = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(buildable.data[attr]),gl.STATIC_DRAW);
        buildable.positions.attributes[attr] = this.locations.attributes[attr];
      });
    },
  };
}

function createAndBindBuffer(gl,type,data,usage){
  const buffer = gl.createBuffer();
  gl.bindBuffer(type,buffer);
  gl.bufferData(type,data,usage);
  return buffer;
}

function updateBuffer(gl,buffer,type,data,usage){
  gl.bindBuffer(type,buffer);
  gl.bufferData(type,data,usage);
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

//get a set of all the vertices in triangles facing a point 
function getFacing(condition,view,vertices,indices,transform){
  const facingVertices = new Set();
  const toView = vec3.create();
  const normal = vec3.create();
  const v0 = vec4.create();
  const v1 = vec4.create();
  const v2 = vec4.create();
  let printout = "";
  for(let i = 0; i < indices.length; i+=3){
    vec4.set(v0,vertices[indices[i]*3],vertices[indices[i]*3+1],vertices[indices[i]*3+2],1);
    vec4.set(v1,vertices[indices[i+1]*3],vertices[indices[i+1]*3+1],vertices[indices[i+1]*3+2],1);
    vec4.set(v2,vertices[indices[i+2]*3],vertices[indices[i+2]*3+1],vertices[indices[i+2]*3+2],1);

    vec4.transformMat4(v0,v0,transform);
    vec4.transformMat4(v1,v1,transform);
    vec4.transformMat4(v2,v2,transform);

    // let v0t = vec3.copy(vec3.create(),v0);
    // let v1t = vec3.copy(vec3.create(),v1);
    // let v2t = vec3.copy(vec3.create(),v2);

    printout = "vertex: ("+v0+"),("+v1+"),("+v2+")";
    vec3.sub(v1,v1,v0);
    vec3.sub(v2,v2,v0);
    vec3.sub(toView,view,v0);
    vec3.cross(normal,v1,v2);
    if(condition(vec3.dot(normal,toView))){
      facingVertices.add(indices[i]);
      facingVertices.add(indices[i+1]);
      facingVertices.add(indices[i+2]);      
      // facingVertices.add(v0t);
      // facingVertices.add(v1t);
      // facingVertices.add(v2t);
      // console.log("normal: "+normal);
      // console.log("toView: "+toView);
      // console.log(printout);
    }
  }

  return facingVertices;
}

function findEdges(camera,mesh){
  const towardsView = (dot)=>(dot > 0);
  const facing = getFacing(towardsView,camera.position,mesh.vertices,mesh.indices,mesh.transform);

  const awayFromView = (dot)=>(dot <= 0);
  const away = getFacing(awayFromView,camera.position,mesh.vertices,mesh.indices,mesh.transform);

  const edges = [...(facing.values())].filter((index)=>away.has(index));
  return edges;
}


export {
  makePerspectiveMatrix,
  initShaderProgram,
  initProgramInfo,
  clearScreen,
  draw,
  createAndBindBuffer,
  enableVertexFloatArrayBuffer,
  updateBuffer,
  loadTexture,
  getFacing,
  findEdges
};