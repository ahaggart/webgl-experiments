/**
 * Voxel.js: basic voxel class that obeys composition model;
 *             can be "built" as a stand-alone self-drawing mesh, or
 *             can be composed into larger meshes
 *
 * planned: textures, etc
 * 
 * Author: Alex Haggart
 */
import {BasicQuad} from './BasicQuad.js';
import {mat4} from 'gl-matrix';
import {createAndBindBuffer,enableVertexFloatArrayBuffer,loadTexture} from './gl-utils.js';

class Voxel{
  constructor(sideLength,position=undefined){ //not positioned default (for aggregation)
    //compose a cube from a set of 6 quads
    const temp = mat4.create();
    const yaxis = [0,1,0];
    const xaxis = [1,0,0];
    const pi2 = Math.PI/2;
    mat4.rotate(temp,temp,-pi2,yaxis);

    //create, offset, and orient the faces
    this.faces = [
      new BasicQuad([sideLength,sideLength],[0,0, sideLength/2]), //front
      new BasicQuad([sideLength,sideLength],[ sideLength/2,0,0]), //right
      new BasicQuad([sideLength,sideLength],[0,0,-sideLength/2]), //back
      new BasicQuad([sideLength,sideLength],[-sideLength/2,0,0]), //left
      new BasicQuad([sideLength,sideLength],[0, sideLength/2,0]), //top
      new BasicQuad([sideLength,sideLength],[0,-sideLength/2,0]), //bottom
    ];
    //rotate front, right, back, left faces by 90 degrees cumulative each
    this.faces.slice(0,4).forEach((face)=>face.adjust(mat4.rotate(temp,temp,pi2,yaxis)));
    mat4.rotate(temp,temp,pi2,yaxis); //reset placeholder matrix to identity
    this.faces[4].adjust(mat4.rotate(temp,temp,-pi2,xaxis));
    this.faces[5].adjust(mat4.rotate(temp,temp,2*pi2,xaxis));
    
    this.position = position;

    this.theta = 0;

    // compose master buffer set from each quad's set
    this.vertices = [];
    this.indices  = [];
    this.colors   = [];
    this.normals  = [];
    this.texCoords= [];
    this.faces.forEach((face,idx)=>{
      //extend master lists with each quad's buffer
      Array.prototype.push.apply(this.vertices, face.vertices);
      Array.prototype.push.apply(this.colors,   face.colors);
      Array.prototype.push.apply(this.texCoords,face.texCoords);
      Array.prototype.push.apply(this.normals,  face.normals.map((n,i)=>n+face.vertices[i]));

      //extend and offset the master index buffer
      Array.prototype.push.apply(this.indices, face.triangles.map((index)=>index+idx*4));
    });

  }
  build(gl,programInfo){
    //create and bind buffers for drawing this voxel
    this.buffers = {}; //create a buffer attribute on this object
    this.buffers.vertices = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.STATIC_DRAW);
    this.buffers.colors   = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.colors),gl.STATIC_DRAW);
    this.buffers.normals  = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.normals),gl.STATIC_DRAW);
    this.buffers.texCoords= createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.texCoords),gl.STATIC_DRAW);
    this.buffers.indices  = createAndBindBuffer(gl,gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.indices),gl.STATIC_DRAW);

    //grab attribute locations from provided program info
    this.positions = {};
    this.positions.vertices = programInfo.locations.attributes.position;
    this.positions.colors   = programInfo.locations.attributes.color;
    this.positions.normals  = programInfo.locations.attributes.normal;
    this.positions.texCoords= programInfo.locations.attributes.texCoord;
    this.positions.modelView= programInfo.locations.uniforms.modelView;

    this.transform = mat4.create();
    mat4.fromTranslation(this.transform,this.position);

  }
  draw(gl){
    mat4.rotate(this.transform,this.transform,2*Math.PI/180,[1,0,0]);
    mat4.rotate(this.transform,this.transform,3*Math.PI/180,[0,1,0]);

    gl.uniformMatrix4fv(
        this.positions.modelView,
        false,
        this.transform);

    enableVertexFloatArrayBuffer(gl,this.buffers.vertices,  this.positions.vertices, 3);
    enableVertexFloatArrayBuffer(gl,this.buffers.normals,   this.positions.normals,  3);
    enableVertexFloatArrayBuffer(gl,this.buffers.texCoords, this.positions.texCoords,2);
    enableVertexFloatArrayBuffer(gl,this.buffers.colors,    this.positions.colors,   4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    { //not sure what the point of this closure is, but it was in the first tutorial I used
      const offset = 0;
      const vertexCount = 36;
      const type = gl.UNSIGNED_SHORT;
      gl.drawElements(gl.TRIANGLES,vertexCount,type,offset);
    }
  }
}

export {Voxel};