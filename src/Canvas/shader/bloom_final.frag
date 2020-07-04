precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;
uniform float intensity;

varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;


void main () {
    vec4 sum = vec4(0.0);
    sum += texture2D(uTexture, vL);
    sum += texture2D(uTexture, vR);
    sum += texture2D(uTexture, vT);
    sum += texture2D(uTexture, vB);
    sum *= 0.25;
    gl_FragColor = sum * intensity;
}
