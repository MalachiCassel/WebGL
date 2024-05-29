var vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec4 vertPosition;',
    'attribute vec3 a_normal;',
    'uniform vec3 u_lightWorldPosition;',
    'uniform vec3 u_viewWorldPosition;',
    'uniform mat4 u_world;',
    'uniform mat4 u_worldViewProjection;',
    'uniform mat4 u_worldInverseTranspose;',
    'varying vec3 v_normal;',
    'varying vec3 v_surfaceToLight;',
    'varying vec3 v_surfaceToView;',
    '',
    'void main()',
    '{',
    'vec4 position = u_worldViewProjection * vertPosition;',
    'gl_Position=position;',
    'v_normal = mat3(u_worldInverseTranspose)*a_normal;',
    'vec3 surfaceWorldPosition=(u_world*vertPosition).xyz;',
    'v_surfaceToLight=u_lightWorldPosition-surfaceWorldPosition;',
    'v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;',
    '}'
  ].join('\n');
  
  var fragmentShaderText = [
    'precision mediump float;',
    '',
    'varying vec3 v_normal;',
    'varying vec3 v_surfaceToLight;',
    'varying vec3 v_surfaceToView;',
    'uniform vec4 u_color;',
    'uniform float u_shininess;',
    'uniform vec3 u_lightDirection;',
    'uniform float u_innerLimit;',
    'uniform float u_outerLimit;',
    'void main()',
    '{',
    ' vec3 normal=normalize(v_normal);',
    ' vec3 surfaceToLightDirection = normalize(v_surfaceToLight);',
    ' vec3 surfaceToViewDirection = normalize(v_surfaceToView);',
    ' vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);',
    ' float dotFromDirection=dot(surfaceToLightDirection,-u_lightDirection);',
    // ' float limitRange=u_innerLimit-u_outerLimit;',
    // ' float inLight=clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);',
    ' float inLight=smoothstep(u_outerLimit,u_innerLimit,dotFromDirection);',
    ' float light=inLight * dot(normal, surfaceToLightDirection);',
    ' float specular = inLight * pow(dot(normal, halfVector), u_shininess);',,
    // ' if (dotFromDirection >= u_limit) {',
    // '   light = dot(normal, surfaceToLightDirection);',
    // '   if (light > 0.0){',
    // '       specular = pow(dot(normal, halfVector), u_shininess);',
    // '   }',
    // ' }',
    ' gl_FragColor = u_color;',
    ' gl_FragColor.rgb*=light;',
    ' gl_FragColor.rgb += specular;',
    '}'
  ].join('\n');
  
  var InitDemo = function() {
    console.log("This is working");
  
    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');
  
    if (!gl) {
        gl = canvas.getContext('experimental-webgl');
    }
  
    if (!gl) {
        alert('Your browser does not support WebGL');
    }
  
    gl.clearColor(0.75, 0.9, 0.65, 1);    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);
  
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader', gl.getShaderInfoLog(fragmentShader));
        return;
    }
  
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program', gl.getProgramInfoLog(program));
        return;
    }
  
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program', gl.getProgramInfoLog(program));
        return;
    }
  
    var positionLocation = gl.getAttribLocation(program, 'vertPosition');
    var matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    var normalLocation = gl.getAttribLocation(program, "a_normal");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    var viewWorldPositionLocation =
        gl.getUniformLocation(program, "u_viewWorldPosition");
    var worldLocation =
        gl.getUniformLocation(program, "u_world");
    var worldViewProjectionLocation =
        gl.getUniformLocation(program, "u_worldViewProjection");
    var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    var shininessLocation = gl.getUniformLocation(program, "u_shininess");
    var lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
    var innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
    var outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    setNormals(gl);
  
    function radToDeg(r) {
        return r * 180 / Math.PI;
    }
  
    function degToRad(d) {
        return d * Math.PI / 180;
    }
  
    var translation = [0, 0, 0];
    var rotation = [degToRad(0), degToRad(0), degToRad(0)];
    var scale = [1,1,1];
    var fieldOfViewRadians = degToRad(60);
    var cameraAngleRadians = degToRad(0);
    var fRotationRadians=degToRad(0);
    var shininess = 150;
    var lightDirection = [0,0,1];
    var innerLimit = degToRad(10);
    var outerLimit = degToRad(30);
    var lightRotationX=0;
    var lightRotationY=0;
  
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      // Turn on culling. By default backfacing triangles
      // will be culled.
      gl.enable(gl.CULL_FACE);
  
      // Enable the depth buffer
      gl.enable(gl.DEPTH_TEST);
  
      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);
  
      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);
  
      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 3;          // 3 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
          positionLocation, size, type, normalize, stride, offset);
        
      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      var size = 3;          // 3 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floating point values
      var normalize = false; // normalize the data (convert from 0-255 to 0-1)
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        normalLocation, size, type, normalize, stride, offset)
  
      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 1;
      var zFar = 2000;
      var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

      var camera=[100,250,200];
      var target=[0,30,0];
      var up = [0, 1, 0];
      var cameraMatrix=m4.lookAt(camera,target,up);
      gl.uniform3fv(viewWorldPositionLocation, camera);
      gl.uniform1f(shininessLocation, shininess);

      var viewMatrix = m4.inverse(cameraMatrix);

      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  
      var worldMatrix = m4.yRotation(fRotationRadians);
      // Multiply the matrices.
      var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
      var worldInverseMatrix = m4.inverse(worldMatrix);
      var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
      //var matrix = m4.translate(viewProjectionMatrix, x, 0, y);
        // Set the matrix.
      //gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);
      gl.uniformMatrix4fv(
        worldLocation, false,
        worldMatrix);
      gl.uniformMatrix4fv(
        worldViewProjectionLocation, false,
        worldViewProjectionMatrix);
      gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
      gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
      // set the light direction.
      const lightPosition = [40, 60, 120];
      gl.uniform3fv(lightWorldPositionLocation, lightPosition);
        // Draw the geometry.
      gl.uniform3fv(viewWorldPositionLocation,camera);
      gl.uniform1f(shininessLocation, shininess);
      {
        var lmat = m4.lookAt(lightPosition, target, up);
        lmat = m4.multiply(m4.xRotation(lightRotationX), lmat);
        lmat = m4.multiply(m4.yRotation(lightRotationY), lmat);
        // get the zAxis from the matrix
        // negate it because lookAt looks down the -Z axis
        lightDirection = [-lmat[8], -lmat[9],-lmat[10]];
    }

      gl.uniform3fv(lightDirectionLocation, lightDirection);
      gl.uniform1f(innerLimitLocation, Math.cos(innerLimit));
      gl.uniform1f(outerLimitLocation, Math.cos(outerLimit));
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 16 * 6;
      gl.drawArrays(primitiveType, offset, count);
      
    // var matrix = makeZToWMatrix(fudgeFactor);
    // matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400));
    // matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    // matrix = m4.xRotate(matrix, rotation[0]);
    // matrix = m4.yRotate(matrix, rotation[1]);
    // matrix = m4.zRotate(matrix, rotation[2]);
    // matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
  
    // gl.uniformMatrix4fv(matrixLocation, false, matrix);
    // //gl.uniform1f(fudgeLocation, fudgeFactor);
  
    // // Adjust the number of vertices based on the provided data (96 vertices = 32 triangles)
    // gl.drawArrays(gl.TRIANGLES, 0, 96);
  
    function setGeometry(gl) {
      var positions = new Float32Array([
              // left column front
              0,   0,  0,
              0, 150,  0,
              30,   0,  0,
              0, 150,  0,
              30, 150,  0,
              30,   0,  0,
    
              // top rung front
              30,   0,  0,
              30,  30,  0,
              100,   0,  0,
              30,  30,  0,
              100,  30,  0,
              100,   0,  0,
    
              // middle rung front
              30,  60,  0,
              30,  90,  0,
              67,  60,  0,
              30,  90,  0,
              67,  90,  0,
              67,  60,  0,
    
              // left column back
                0,   0,  30,
               30,   0,  30,
                0, 150,  30,
                0, 150,  30,
               30,   0,  30,
               30, 150,  30,
    
              // top rung back
               30,   0,  30,
              100,   0,  30,
               30,  30,  30,
               30,  30,  30,
              100,   0,  30,
              100,  30,  30,
    
              // middle rung back
               30,  60,  30,
               67,  60,  30,
               30,  90,  30,
               30,  90,  30,
               67,  60,  30,
               67,  90,  30,
    
              // top
                0,   0,   0,
              100,   0,   0,
              100,   0,  30,
                0,   0,   0,
              100,   0,  30,
                0,   0,  30,
    
              // top rung right
              100,   0,   0,
              100,  30,   0,
              100,  30,  30,
              100,   0,   0,
              100,  30,  30,
              100,   0,  30,
    
              // under top rung
              30,   30,   0,
              30,   30,  30,
              100,  30,  30,
              30,   30,   0,
              100,  30,  30,
              100,  30,   0,
    
              // between top rung and middle
              30,   30,   0,
              30,   60,  30,
              30,   30,  30,
              30,   30,   0,
              30,   60,   0,
              30,   60,  30,
    
              // top of middle rung
              30,   60,   0,
              67,   60,  30,
              30,   60,  30,
              30,   60,   0,
              67,   60,   0,
              67,   60,  30,
    
              // right of middle rung
              67,   60,   0,
              67,   90,  30,
              67,   60,  30,
              67,   60,   0,
              67,   90,   0,
              67,   90,  30,
    
              // bottom of middle rung.
              30,   90,   0,
              30,   90,  30,
              67,   90,  30,
              30,   90,   0,
              67,   90,  30,
              67,   90,   0,
    
              // right of bottom
              30,   90,   0,
              30,  150,  30,
              30,   90,  30,
              30,   90,   0,
              30,  150,   0,
              30,  150,  30,
    
              // bottom
              0,   150,   0,
              0,   150,  30,
              30,  150,  30,
              0,   150,   0,
              30,  150,  30,
              30,  150,   0,
    
              // left side
              0,   0,   0,
              0,   0,  30,
              0, 150,  30,
              0,   0,   0,
              0, 150,  30,
              0, 150,   0]);
    
      // Center the F around the origin and Flip it around. We do this because
      // we're in 3D now with and +Y is up where as before when we started with 2D
      // we had +Y as down.
    
      // We could do by changing all the values above but I'm lazy.
      // We could also do it with a matrix at draw time but you should
      // never do stuff at draw time if you can do it at init time.
      var matrix = m4.xRotation(Math.PI);
      matrix = m4.translate(matrix, -50, -75, -15);
    
      for (var ii = 0; ii < positions.length; ii += 3) {
        var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
      }
    
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }
    
    function setColors(gl) {
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Uint8Array([
                200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
  
          // top rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
  
          // middle rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
  
          // left column back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
  
          // top rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
  
          // middle rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
  
          // top
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
  
          // top rung right
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
  
          // under top rung
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
  
          // between top rung and middle
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
  
          // top of middle rung
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
  
          // right of middle rung
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
  
          // bottom of middle rung.
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
  
          // right of bottom
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
  
          // bottom
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
  
          // left side
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220]),
            gl.STATIC_DRAW);
    }    
  };
  function setNormals(gl) {
    var normals = new Float32Array([
            // left column front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
   
            // top rung front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
   
            // middle rung front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
   
            // left column back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
   
            // top rung back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
   
            // middle rung back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
   
            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
   
            // top rung right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
   
            // under top rung
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
   
            // between top rung and middle
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
   
            // top of middle rung
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
   
            // right of middle rung
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
   
            // bottom of middle rung.
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
   
            // right of bottom
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
   
            // bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
   
            // left side
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  }
  var m4 = {
    
    translation: function(tx, ty, tz) {
      return [
         1,  0,  0,  0,
         0,  1,  0,  0,
         0,  0,  1,  0,
         tx, ty, tz, 1,
      ];
    },
   
    xRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
   
      return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
      ];
    },
   
    yRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
   
      return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
      ];
    },
   
    zRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
   
      return [
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1,
      ];
    },
   
    scaling: function(sx, sy, sz) {
      return [
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1,
      ];
    },
  
    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
      },
     
      xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
      },
     
      yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
      },
     
      zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
      },
     
      scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
      },
    
      perspective: function(fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);
     
        return [
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (near + far) * rangeInv, -1,
          0, 0, near * far * rangeInv * 2, 0
        ];
      },
  
      multiply: function(a, b) {
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
     
        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
      },
    
      projection: function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
           2 / width, 0, 0, 0,
           0, -2 / height, 0, 0,
           0, 0, 2 / depth, 0,
          -1, 1, 0, 1,
        ];
      },
      inverse: function(m) {
        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];
        var tmp_0  = m22 * m33;
        var tmp_1  = m32 * m23;
        var tmp_2  = m12 * m33;
        var tmp_3  = m32 * m13;
        var tmp_4  = m12 * m23;
        var tmp_5  = m22 * m13;
        var tmp_6  = m02 * m33;
        var tmp_7  = m32 * m03;
        var tmp_8  = m02 * m23;
        var tmp_9  = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;
    
        var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    
        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    
        return [
          d * t0,
          d * t1,
          d * t2,
          d * t3,
          d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
          d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
          d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
          d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
          d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
          d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
          d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
          d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
          d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
          d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
          d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
          d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
        ];
      },
    
      vectorMultiply: function(v, m) {
        var dst = [];
        for (var i = 0; i < 4; ++i) {
          dst[i] = 0.0;
          for (var j = 0; j < 4; ++j) {
            dst[i] += v[j] * m[j * 4 + i];
          }
        }
        return dst;
      },
      lookAt: function(cameraPosition, target, up) {
        var zAxis = normalize(
            subtractVectors(cameraPosition, target));
        var xAxis = normalize(cross(up, zAxis));
        var yAxis = normalize(cross(zAxis, xAxis));
     
        return [
           xAxis[0], xAxis[1], xAxis[2], 0,
           yAxis[0], yAxis[1], yAxis[2], 0,
           zAxis[0], zAxis[1], zAxis[2], 0,
           cameraPosition[0],
           cameraPosition[1],
           cameraPosition[2],
           1,
        ];
      },
      normalize: function(v){
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        // make sure we don't divide by 0.
        if (length > 0.00001) {
          return [v[0] / length, v[1] / length, v[2] / length];
        } else {
          return [0, 0, 0];
        }
      },
      transpose: function(m) {
        return [
          m[0], m[4], m[8], m[12],
          m[1], m[5], m[9], m[13],
          m[2], m[6], m[10], m[14],
          m[3], m[7], m[11], m[15],
        ];
      }
  };
  function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  }
  function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]];
  }
  function step(a, b) {
    if (b >= a) {
        return 1;
    } else {
        return 0;
    }
 }