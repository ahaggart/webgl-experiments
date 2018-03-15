attribute vec4 aColor;
attribute vec4 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTexCoord;
varying mediump vec3 vNormal;
varying mediump vec3 vPosition;
varying mediump vec4 vColor;

void main() {
  vec4 worldPosition  = uModelViewMatrix * aPosition;
  vec4 normalPosition = uModelViewMatrix * aNormal;
  
  vColor = aColor;

  vNormal = normalPosition.xyz - worldPosition.xyz;

  vTexCoord = aTexCoord;

  vPosition = worldPosition.xyz;

  gl_Position = uProjectionMatrix * worldPosition;
  // gl_Position = worldPosition;
}