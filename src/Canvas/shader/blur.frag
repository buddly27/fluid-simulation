precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;


void main () {
    vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
    sum += texture2D(uTexture, vL) * 0.35294117;
    sum += texture2D(uTexture, vR) * 0.35294117;
    gl_FragColor = sum;
}
