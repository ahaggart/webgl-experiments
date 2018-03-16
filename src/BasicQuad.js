/**
 * BasicQuad.js: BasicQuad class for testing and composing larger meshes
 * 
 * planned: more composition-friendly functions for mesh-building
 * 
 * Author: Alex Haggart
 */
import {createAndBindBuffer,enableVertexFloatArrayBuffer} from './gl-utils.js';
import {mat4,vec4,vec3} from 'gl-matrix';

class BasicQuad{
  constructor(size,position=undefined){
    this.vertices = [
      -size[0],-size[1],1, //  3 <-- 2
       size[0],-size[1],1, //  |     ^
       size[0], size[1],1, //  v     |
      -size[0], size[1],1, //  0 --> 1
    ].map((mag)=>mag/2.0);

    this.triangles = [0,1,2,  2,3,0]; //CCW oriented

    this.colors = [ //default colors to test shaders
      1,0,0,1,
      1,0,0,1,
      1,0,0,1,
      1,0,0,1,
    ];

    this.normals = [ //this is an xy quad, so all the normals are in z
      0,0,1,
      0,0,1,
      0,0,1,
      0,0,1,
    ];

    this.texCoords = [
      0.0,0.0,
      1.0,0.0,
      1.0,1.0,
      0.0,1.0,
    ];

    this.position = vec3.add([],position,[0,0,-10]);
  }

  //adjust the raw coordinates of this quad (not the transform)
  adjust(transform){
    //this could be more efficient and prettier
    let v0 = this.vertices.slice(0,3);  v0.push(1);
    let v1 = this.vertices.slice(3,6);  v1.push(1);
    let v2 = this.vertices.slice(6,9);  v2.push(1);
    let v3 = this.vertices.slice(9,12); v3.push(1);
    vec4.transformMat4(v0,v0,transform);
    vec4.transformMat4(v1,v1,transform);
    vec4.transformMat4(v2,v2,transform);
    vec4.transformMat4(v3,v3,transform);

    this.vertices = [
      v0[0],v0[1],v0[2],
      v1[0],v1[1],v1[2],
      v2[0],v2[1],v2[2],
      v3[0],v3[1],v3[2],
    ];

    let n0 = this.normals.slice(0,3);  n0.push(1);
    let n1 = this.normals.slice(3,6);  n1.push(1);
    let n2 = this.normals.slice(6,9);  n2.push(1);
    let n3 = this.normals.slice(9,12); n3.push(1);
    vec4.transformMat4(n0,n0,transform);
    vec4.transformMat4(n1,n1,transform);
    vec4.transformMat4(n2,n2,transform);
    vec4.transformMat4(n3,n3,transform);

    this.normals = [
      n0[0],n0[1],n0[2],
      n1[0],n1[1],n1[2],
      n2[0],n2[1],n2[2],
      n3[0],n3[1],n3[2],
    ];

  }

  //builds this quad as a stand-alone drawable, with its own buffers
  //larger aggregations of BasicQuads should not call build() on composing quads
  build(gl,programInfo){
    //build the normal vectors for the shader
    this.normals = this.normals.map((normal,index)=>normal+this.vertices[index]);

    //create and bind buffers for drawing this quad
    this.buffers = {}; //create a buffer attribute on this object
    this.buffers.vertices  = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.STATIC_DRAW);
    this.buffers.colors    = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.colors),gl.STATIC_DRAW);
    this.buffers.normals   = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.normals),gl.STATIC_DRAW);
    this.buffers.texCoords = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.texCoords),gl.STATIC_DRAW);
    this.buffers.triangles = createAndBindBuffer(gl,gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.triangles),gl.STATIC_DRAW);

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

  //draw this quad
  //use the positions we grabbed during build by default, else use whatever got passed in
  draw(gl,positions=this.positions){
    gl.uniformMatrix4fv(
        this.positions.modelView,
        false,
        this.transform);

    enableVertexFloatArrayBuffer(gl,this.buffers.vertices,  positions.vertices,   3);
    enableVertexFloatArrayBuffer(gl,this.buffers.normals,   positions.normals,    3);
    enableVertexFloatArrayBuffer(gl,this.buffers.texCoords, positions.texCoords,  2);
    enableVertexFloatArrayBuffer(gl,this.buffers.colors,    positions.colors,     4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.triangles);
    { //not sure what the point of this closure is, but it was in the first tutorial I used
      const offset = 0;
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      gl.drawElements(gl.TRIANGLES,vertexCount,type,offset);
    }
  }
  //TODO: aggregation methods for linking this quad into a larger mesh
}

export {BasicQuad};