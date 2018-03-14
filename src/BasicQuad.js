import {createAndBindBuffer,enableVertexFloatArrayBuffer} from './gl-utils.js';
import {mat4,vec4} from 'gl-matrix';

class BasicQuad{
  constructor(size,position=[0,0,0]){
    this.vertices = [
      -size[0],-size[1],1, //  3 <-- 2
       size[0],-size[1],1, //  |     ^
       size[0], size[1],1, //  v     |
      -size[0], size[1],1, //  0 --> 1
    ].map((mag)=>mag/2.0);

    this.triangles = [0,1,2,  2,3,0]; //CCW oriented

    this.colors = [ //default colors to test shaders
      1,0,0,1,
      0,1,0,1,
      0,0,1,1,
      1,1,0,1,
    ];

    this.normals = [ //this is an xy quad, so all the normals are in z
      0,0,1,
      0,0,1,
      0,0,1,
      0,0,1,
    ];

    this.transform = mat4.create();
    mat4.fromTranslation(this.transform,position);
  }

  //builds this quad as a stand-alone drawable, with its own buffers
  //larger aggregations of BasicQuads should not call build() on composing quads
  build(gl,programInfo){
    //create and bind buffers for drawing this quad
    this.buffers = {}; //create a buffer attribute on this object
    this.buffers.vertices  = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.STATIC_DRAW);
    this.buffers.colors    = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.colors),gl.STATIC_DRAW);
    this.buffers.normals   = createAndBindBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.normals),gl.STATIC_DRAW);
    this.buffers.triangles = createAndBindBuffer(gl,gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.triangles),gl.STATIC_DRAW);

    //grab attribute locations from provided program info
    this.positions = {};
    this.positions.vertices = programInfo.locations.attributes.position;
    this.positions.colors   = programInfo.locations.attributes.color;
    this.positions.normals  = programInfo.locations.attributes.normal;
    this.positions.modelView= programInfo.locations.uniforms.modelView;
  }

  //draw this quad
  //use the positions we grabbed during build by default, else use whatever got passed in
  draw(gl,positions=this.positions){
    gl.uniformMatrix4fv(
        this.positions.modelView,
        false,
        this.transform);

    enableVertexFloatArrayBuffer(gl,this.buffers.vertices,positions.vertices, 3);
    enableVertexFloatArrayBuffer(gl,this.buffers.normals, positions.normals,  3);
    enableVertexFloatArrayBuffer(gl,this.buffers.colors,  positions.colors,   4);

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