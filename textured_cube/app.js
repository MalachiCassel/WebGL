var vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec3 vertPosition;',
    'attribute vec2 vertTextCoord;',
    'varying vec2 fragTextCoord;',
    'uniform mat4 mWorld;',
    'uniform mat4 mView;',
    'uniform mat4 mProj;',
    '',
    'void main()',
    '{',
    'fragTextCoord = vertTextCoord;',
    'gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
    '}'
].join('\n');

var fragmentShaderText = [
    'precision mediump float;',
    '',
    'varying vec2 fragTextCoord;',
    'uniform sampler2D sampler;',
    'void main()',
    '{',
    'gl_FragColor = texture2D(sampler, fragTextCoord);',
    '}'
].join('\n');

var InitDemo = function () {
    console.log("this is working");

    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');

    if (!gl) {
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    gl.clearColor(0.85, 0.9, 0, 0.3);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);
    // gl.cullFace(gl.BACK);

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

    var boxVertices = [
        // x, y, z          U,V
        // Top
        -1.0,  1.0, -1.0,   0,0,
        -1.0,  1.0,  1.0,   0,1,
         1.0,  1.0,  1.0,   1,1,
         1.0,  1.0, -1.0,   1,0,
        // Left
        -1.0,  1.0,  1.0,   0,0,
        -1.0, -1.0,  1.0,   1,0,
        -1.0, -1.0, -1.0,   1,1,
        -1.0,  1.0, -1.0,   0,1,
        // Right
         1.0,  1.0,  1.0,   1,1,
         1.0, -1.0,  1.0,   0,1,
         1.0, -1.0, -1.0,   0,0,
         1.0,  1.0, -1.0,   1,0,
        // Front
         1.0,  1.0,  1.0,   1,1,
         1.0, -1.0,  1.0,   1,0,
        -1.0, -1.0,  1.0,   0,0,
        -1.0,  1.0,  1.0,   0,1,
        // Back
        -1.0,  1.0, -1.0,   0,1,
        -1.0, -1.0, -1.0,   0,0,
         1.0, -1.0, -1.0,   1,0,
         1.0,  1.0, -1.0,   1,1,
        // Bottom
        -1.0, -1.0, -1.0,   1,1,
        -1.0, -1.0,  1.0,   1,0,
         1.0, -1.0,  1.0,   0,0,
         1.0, -1.0, -1.0,   0,1,
    ];

    var boxIndices = [
        // Top
        0, 1, 2,
        0, 2, 3,
        // Left
        4, 5, 6,
        4, 6, 7,
        // Right
        8, 9, 10,
        8, 10, 11,
        // Front
        12, 13, 14,
        12, 14, 15,
        // Back
        16, 17, 18,
        16, 18, 19,
        // Bottom
        20, 21, 22,
        20, 22, 23,
    ];

    var boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBufferObject=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    var textCoordAttribLocation = gl.getAttribLocation(program, 'vertTextCoord');
    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0 // offset
    );

    gl.vertexAttribPointer(
        textCoordAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT // offset
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(textCoordAttribLocation);

    //create texture
    var boxTexture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,boxTexture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texImage2D(
    //     gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
    //     gl.UNSIGNED_BYTE, document.getElementById('crate-image')
    // );

    // gl.bindTexture(gl.TEXTURE_2D,null);
    var image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    image.src = 'RTS_Crate.png';
    image.crossOrigin = 'anonymous'; 

    gl.useProgram(program);

    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix,[0,0,-5],[0,0,0],[0,1,0]);
    //mat4.identity(viewMatrix);
    //mat4.identity(projMatrix);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    var xRotationMatrix=new Float32Array(16);
    var yRotationMatrix=new Float32Array(16);

    var angle=0;
    var identityMatrix=new Float32Array(16);
    mat4.identity(identityMatrix);
    var loop=function(){
        angle=performance.now()/1000/6*2*Math.PI;
        mat4.rotate(yRotationMatrix,identityMatrix,angle,[0,1,0]);
        mat4.rotate(xRotationMatrix,identityMatrix,angle/4,[1,0,0]);
        mat4.mul(worldMatrix,xRotationMatrix,yRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation,gl.FALSE,worldMatrix);

        gl.clearColor(0.75,0.85,0.8,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D,boxTexture);
        gl.activeTexture(gl.TEXTURE0);
        gl.drawElements(gl.TRIANGLES,boxIndices.length,gl.UNSIGNED_SHORT,0);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

};

//window.onload = InitDemo;


// function vertexShader(vertPosition, vertColor){
//     return{
//         fragColor:vertColor,
//         gl_position: [vertPosition.x, vertPosition.y, 0.0, 1]
//     };
// }