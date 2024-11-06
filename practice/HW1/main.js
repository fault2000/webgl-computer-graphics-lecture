"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import VertexArray from '../_classes/VertexArray.js';
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

var pyramidPositions = [
    0.0, 1.0, 0.0, 1.0, 0.0, 0.0,//0번 vertex
    1.0, 0.0, 0.0, 0.0, 1.0, 0.0,//1번 vertex
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,//2번 vertex
    -1.0, 0.0, 0.0, 1.0, 1.0, 0.0,//3번 vertex
    0.0, 0.0, -1.0, 0.0, 1.0, 1.0,//4번 vertex
];
var pytamidIndices = [
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 1,
    1, 2, 4,
    2, 3, 4,
];

async function main() {
  // Get A WebGL context
  let canvas = document.querySelector("#c");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  //---Camera(view) Initialize
  let eye = [0.0, 1.0, 4.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let movespeed = 0.05;
  let turnspeed = 0.5;
  let mainCamera = new Camera(eye,up,yaw,pitch,movespeed,turnspeed);
  
  //---Projection Initialize
  let fovRadian = 90.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  //---Shader Initialize
  let shader = new Shader(gl,textureVertexShader,textureFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  
  let rotationAngle = 0;

  requestAnimationFrame(drawScene);
  
  // 화면 검은색 설정 및 깊이 테스트 활성화
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  // back face culling 활성화
  gl.enable(gl.CULL_FACE);

  function drawScene()
  {
    //화면 크기 재조정
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
    {
      //---카메라 설정(현재는 모든 모델에 대해 동일한 뷰행렬 사용)
      let view = mainCamera.CalculateViewMatrix();
      shader.SetUniformMat4f(gl, "u_view", view);
      
      //---육면체 그리기
      rotationAngle += Math.PI * 1 / 180;

      let model = mat4.create();
      mat4.fromXRotation(model, rotationAngle);
      shader.SetUniformMat4f(gl, "u_model", model);

      //텍스처를 바인딩하고, 셰이더의 sampler2D u_texture에 해당 텍스처를 사용합니다.
	    //0번 텍스처 유닛에 텍스처를 바인딩하고, 셰이더에는 0번 유닛으로부터 텍스처 값을 얻어오게 합니다.
	    internetTexture.Bind(gl,0);
      shader.SetUniform1i(gl, "u_mainTexture", 0);

      cube.RenderModel(gl, shader);
      
      //---주전자 그리기
      model = mat4.create();
      mat4.translate(model, model, [3, 0, 0]);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      shader.SetUniformMat4f(gl, "u_model", model);

      //주전자에는 checker texture를 사용해 보겠습니다.
      //이번에는 1번 텍스처 유닛에 바인딩하고 셰이더에는 1번 유닛을 사용하도록 알려줍니다.
      checkerTexture.Bind(gl,0);
      shader.SetUniform1i(gl, "u_mainTexture", 0);
      
      teapot.RenderModel(gl, shader);
    }
    
    shader.Unbind(gl);

    requestAnimationFrame(drawScene);
  }

  window.addEventListener('keydown', KeyboardEventHandler);
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    mainCamera.KeyControl(e); 
  }

  //마우스 이벤트 핸들러 함수
  function MouseMoveEventHandler(e)
  {
    mainCamera.MouseControl(e); 
  }
}

main();