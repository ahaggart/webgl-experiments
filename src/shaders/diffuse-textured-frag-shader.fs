precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLight;
uniform sampler2D uSampler;

varying highp vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vColor;

void main() {
  vec3 toLight = uLightPosition - vPosition;
  toLight = normalize(toLight);

  vec3 fNormal = normalize(vNormal);
  float angle = clamp(dot(toLight,fNormal),0.0,1.0);

  vec4 vColor = texture2D(uSampler,vTexCoord);

  vec3 ambientComponent = uAmbientLight * vColor.xyz;

  gl_FragColor = clamp(vec4(vColor.xyz * angle + ambientComponent,vColor.a),0.0,1.0);
}