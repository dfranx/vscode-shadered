#version 330

in vec4 color;
out vec4 outColor;

void main() {
   outColor = color * 0.5f;
}