var InitDemo = function() {
    console.log("This is working");
    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext("webgl");
    if (!gl) {
      return;
    }gl.enable(gl.DEPTH_TEST);
    //spheres
    //var buffers = window.primitives.createSphereBuffers(gl, 10, 48, 24);
    //traingles
    // var arrays = {
    //     position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
    //     texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
    //     normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    //  };
    //squares
    var arrays = {
        position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
        texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
        normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
        indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
     };
   
     var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);   
    // setup GLSL program
    // var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    // var uniformSetters = webglUtils.createUniformSetters(gl, program);
    // var attribSetters  = webglUtils.createAttributeSetters(gl, program);
    //can be simplified to
    var programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    //this is what this inside of createBufferInfoFromArrays looks like
    // var attribs = {
    //   a_position: { buffer: buffers.position, numComponents: 3, },
    //   a_normal:   { buffer: buffers.normal,   numComponents: 3, },
    //   a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
    // };
  
    function degToRad(d) {
      return d * Math.PI / 180;
    }
  
    var cameraAngleRadians = degToRad(0);
    var fieldOfViewRadians = degToRad(60);
    var cameraHeight = 50;
  
    var uniformsThatAreTheSameForAllObjects = {
      u_lightWorldPos:         [-50, 30, 100],
      u_viewInverse:           m4.identity(),
      u_lightColor:            [1, 1, 1, 1],
    };
  
    var uniformsThatAreComputedForEachObject = {
      u_worldViewProjection:   m4.identity(),
      u_world:                 m4.identity(),
      u_worldInverseTranspose: m4.identity(),
    };
  
    var rand = function(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + Math.random() * (max - min);
    };
  
    var randInt = function(range) {
      return Math.floor(Math.random() * range);
    };
  
    var textures = [
      textureUtils.makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC", }),
      textureUtils.makeCheckerTexture(gl, { color1: "#FFF", color2: "#CCC", }),
      textureUtils.makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC", }),
    ];
  
    var objects = [];
    var numObjects = 300;
    var baseColor = rand(240);
    for (var ii = 0; ii < numObjects; ++ii) {
      objects.push({
        radius: rand(150),
        xRotation: rand(Math.PI * 2),
        yRotation: rand(Math.PI),
        materialUniforms: {
          u_colorMult:             chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
          u_diffuse:               textures[randInt(textures.length)],
          u_specular:              [1, 1, 1, 1],
          u_shininess:             rand(500),
          u_specularFactor:        rand(1),
        },
      });
    }
  
    requestAnimationFrame(drawScene);
  
    // Draw the scene.
    function drawScene(time) {
      time = time * 0.0001 + 5;
  
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
      // Clear the canvas AND the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    //   gl.enable(gl.CULL_FACE);
    //   gl.enable(gl.DEPTH_TEST);
  
      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
  
      // Compute the camera's matrix using look at.
      var cameraPosition = [0, 0, 100];
      var target = [0, 0, 0];
      var up = [0, 1, 0];
      var cameraMatrix = m4.lookAt(cameraPosition, target, up, uniformsThatAreTheSameForAllObjects.u_viewInverse);
  
      // Make a view matrix from the camera matrix.
      var viewMatrix = m4.inverse(cameraMatrix);
  
      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  
      gl.useProgram(programInfo.program);
  
      // Setup all the needed attributes.
      //webglUtils.setAttributes(attribSetters, attribs);
      // Bind the indices.
      //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  
      // Set the uniforms that are the same for all objects.
      webglUtils.setUniforms(programInfo, uniformsThatAreTheSameForAllObjects);
  
      // Draw objects
      objects.forEach(function(object) {
  
        // Compute a position for this object based on the time.
        var worldMatrix = m4.xRotation(object.xRotation * time);
        worldMatrix = m4.yRotate(worldMatrix, object.yRotation * time);
        worldMatrix = m4.translate(worldMatrix, 0, 0, object.radius);
        uniformsThatAreComputedForEachObject.u_world = worldMatrix;
  
        // Multiply the matrices.
        m4.multiply(viewProjectionMatrix, worldMatrix, uniformsThatAreComputedForEachObject.u_worldViewProjection);
        m4.transpose(m4.inverse(worldMatrix), uniformsThatAreComputedForEachObject.u_worldInverseTranspose);
  
        // Set the uniforms we just computed
        webglUtils.setUniforms(programInfo, uniformsThatAreComputedForEachObject);
  
        // Set the uniforms that are specific to the this object.
        webglUtils.setUniforms(programInfo, object.materialUniforms);
  
        // Draw spheres.
        //gl.drawElements(gl.TRIANGLES, buffer.numElements, gl.UNSIGNED_SHORT, 0);
        //draw triangles
        //gl.drawArrays(gl.TRIANGLES,0,bufferInfo.numElements);
        //draw squares
        gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      });
  
      requestAnimationFrame(drawScene);
    }
  }