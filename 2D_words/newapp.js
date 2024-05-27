var vertexShaderText=
[
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    'uniform mat3 u_matrix;',
    '',
    'void main()',
    '{',
    'gl_Position = vec4((u_matrix * vec3(vertPosition, 1)).xy, 0, 1);',
    '}'
].join('\n');

var fragmentShaderText=
[
    'precision mediump float;',
    '',
    'uniform vec4 fragColor;',
    'void main()',
    '{',
    'gl_FragColor=fragColor;',
    '}'
].join('\n');

var InitDemo=function (){
    console.log("this is working");
    
    var canvas=document.getElementById('game-surface');
    var gl=canvas.getContext('webgl');

    if(!gl){
        gl=canvas.getContext('experimental-webgl');
    }

    if(!gl){
        alert('Your browser does not  support WebGL');
    }

    gl.clearColor(0.75,0.9,0.65,1);    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var vertexShader=gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader=gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader,vertexShaderText);
    gl.shaderSource(fragmentShader,fragmentShaderText);

    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
        console.error('ERROR compiling vertex shader',gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
        console.error('ERROR compiling fragment shader',gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program=gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        console.error('ERROR linking program',gl.getProgramInfoLog(program))
        return;
    }

    gl.validateProgram(program);
    if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
        console.error('ERROR validating program',gl.getProgramInfoLog(program))
        return;
    }
    
    var positionAttribLocation=gl.getAttribLocation(program,'vertPosition');
    var colorLocation = gl.getUniformLocation(program, "fragColor");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    var positionBufferObject=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBufferObject);

    setGeometry(gl);

    var translation=[500,500];
    var angle=30;
    var angleInRadians=angle*Math.PI/180;
    var color = [Math.random(), Math.random(), Math.random(), 1];
    var scale=[0.85,0.85];

    gl.viewport(0,0,canvas.width,canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        0,
        0 //offsets
    );

    gl.uniform4fv(colorLocation, color);

    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(angleInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);
    var projectionMatrix = m3.projection(
        gl.canvas.clientWidth, gl.canvas.clientHeight);
   

    //var matrix = m3.identity();
    var moveOriginMatrix = m3.translation(-50, -75);

        // Multiply the matrices.
    var matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
     
        // Set the matrix.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);
     
        // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 18);

    setGeometry2(gl);

    gl.drawArrays(gl.TRIANGLES, 0, 24);

    function setGeometry(gl) {
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                // left column
                0, 0,
                30, 0,
                0, 150,
                0, 150,
                30, 0,
                30, 150,
       
                // top rung
                30, 0,
                100, 0,
                30, 30,
                30, 30,
                100, 0,
                100, 30,
       
                // middle rung
                30, 60,
                67, 60,
                30, 90,
                30, 90,
                67, 60,
                67, 90,
            ]),
            gl.STATIC_DRAW);
      }

    function setGeometry2(gl){
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                // left column
                110, 0,
                140, 0,
                110, 150,
                110, 150,
                140, 0,
                140, 150,
       
                // top rung
                140, 0,
                210, 0,
                140, 30,
                140, 30,
                210, 0,
                210, 30,
       
                // middle rung
                140, 60,
                210, 60,
                140, 90,
                140, 90,
                210, 60,
                210, 90,

                //connect
                210,0,
                180,0,
                180,90,
                180,90,
                210,90,
                210,0,

            ]),
            gl.STATIC_DRAW);
    }
};

var m3 = {
    translation: function(tx, ty) {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
      ];
    },
  
    rotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      return [
        c,-s, 0,
        s, c, 0,
        0, 0, 1,
      ];
    },
  
    scaling: function(sx, sy) {
      return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
      ];
    },

    identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

    projection: function(width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },
  
    multiply: function(a, b) {
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },
  };