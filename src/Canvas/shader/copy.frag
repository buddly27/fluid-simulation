precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

varying highp vec2 vUv;


void main () {
    gl_FragColor = texture2D(uTexture, vUv);
}
