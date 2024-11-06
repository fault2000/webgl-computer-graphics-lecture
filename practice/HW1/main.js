"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import VertexArray from '../_classes/VertexArray.js';
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

var pyramidVertexShaderSource = 
`#version 300 es

layout(location=0) in vec3 a_position; 
layout(location=1) in vec3 a_color; 

//--Uniforms
uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

//--Varyings
out vec3 v_color;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
  v_color = a_color;
}
`;

var pyramidFragmentShaderSource = 
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec3 v_color;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;

async function main() {
  // Get A WebGL context
  let canvas = document.querySelector("#c");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  // 피라미드 정점 데이터
  var pyramidVertices = [
    0.0, 1.0, 0.0, 1.0, 0.0, 0.0,//0번 vertex
    1.0, 0.0, 0.0, 0.0, 1.0, 0.0,//1번 vertex
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,//2번 vertex
    -1.0, 0.0, 0.0, 1.0, 1.0, 0.0,//3번 vertex
    0.0, 0.0, -1.0, 0.0, 1.0, 1.0,//4번 vertex
  ];
  // 피라미드 인덱스 데이터
  var pyramidIndices = [
    2, 1, 0,
    3, 2, 0,
    4, 3, 0,
    1, 4, 0,
    4, 2, 1,
    4, 3, 2,
  ];

  let pyramidVA = new VertexArray(gl); 
  let pyramidVB = new VertexBuffer(gl,pyramidVertices);
  pyramidVA.AddBuffer(gl, pyramidVB, [3, 3], [false, false]);
  let pyramidIB = new IndexBuffer(gl, pyramidIndices, 18);

  let eye = [0.0, 1.0, 4.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let movespeed = 0.05;
  let turnspeed = 0.5;
  let mainCamera = new Camera(eye,up,yaw,pitch,movespeed,turnspeed);

  //orthographc 대신 perspective projection matrix 사용
  let fovRadian = 90.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  let shader = new Shader(gl, pyramidVertexShaderSource, pyramidFragmentShaderSource);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  pyramidVA.Unbind(gl); 
  pyramidVB.Unbind(gl);
  pyramidIB.Unbind(gl);
  shader.Unbind(gl);

  let renderer = new Renderer();
  // 화면 검은색 설정 및 깊이 테스트 활성화
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // back face culling 활성화
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  requestAnimationFrame(drawScene);

  //---UI 셋업
  var rotation = 0;
  //슬라이더가 움직일 때마다, slide에 할당할 콜백함수가 호출됨
  webglLessonsUI.setupSlider("#PyramidRotationY", {slide: updateRotation, min: 0, max: 360, step: 1});

  //slide 콜백함수
  function updateRotation(event, ui)
  {
    rotation = ui.value;
	  requestAnimationFrame(drawScene);
  }

  function drawScene()
  {
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
    {
      let view = mainCamera.CalculateViewMatrix();
      shader.SetUniformMat4f(gl, "u_view", view); 

      let model = mat4.create();
      mat4.rotateY(model, model, rotation * Math.PI / 180); // Y축 회전 적용
      shader.SetUniformMat4f(gl, "u_model", model);

      renderer.Draw(gl, pyramidVA, pyramidIB, shader);
    }

    shader.Unbind(gl);
    requestAnimationFrame(drawScene);
  }

  window.addEventListener('keydown', KeyboardEventHandler);
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    mainCamera.KeyControl(e); // 카메라 클래스의 KeyControl로 이벤트 정보 전달
  }
}

main();
