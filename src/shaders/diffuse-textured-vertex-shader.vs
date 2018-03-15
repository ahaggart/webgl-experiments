attribute vec4 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextCoord;
varying mediump vec3 vNormal;
varying mediump vec3 vPosition;

void main() {
  vec4 worldPosition  = uModelViewMatrix * aPosition;
  vec4 normalPosition = uModelViewMatrix * aNormal;

  vNormal = normalPosition.xyz - worldPosition.xyz;

  vTexCoord = aTexCoord;

  vPosition = worldPosition.xyz;

  gl_Position = uProjectionMatrix * worldPosition;
  // gl_Position = worldPosition;
}