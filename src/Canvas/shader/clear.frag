precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;
uniform float value;

varying highp vec2 vUv;


void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
}
