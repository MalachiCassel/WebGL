var vertexShaderText=
[
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    'uniform vec2 u_resolution;',
    'uniform vec2 u_translation;',
    'uniform vec2 u_rotation;',
    'uniform vec2 u_scale;',
    '',
    'void main()',
    '{',
    'vec2 scaledPosition = vertPosition * u_scale;',
    'vec2 rotatedPosition = vec2(scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);',
    'vec2 position = rotatedPosition + u_translation;',
    'vec2 zeroToOne = position / u_resolution;',
    'vec2 zeroToTwo = zeroToOne * 2.0;',
    'vec2 clipSpace = zeroToTwo - 1.0;',
    'gl_Position=vec4(clipSpace * vec2(1, -1), 0, 1);',
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

    gl.clearColor(0.75,0.9,0.65,1);    // gl.vertexAttribPointer(
        //     positionAttribLocation,
        //     2,
        //     gl.FLOAT,
        //     gl.FALSE,
        //     2*Float32Array.BYTES_PER_ELEMENT,
        //     0 //offsets
        // );
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
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var colorLocation = gl.getUniformLocation(program, "fragColor");
    var translationLocation = gl.getUniformLocation(program, "u_translation");
    var rotationLocation = gl.getUniformLocation(program, "u_rotation");
    var scaleLocation = gl.getUniformLocation(program, "u_scale");

    var positionBufferObject=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBufferObject);

    setGeometry(gl);

    var translation=[300,100];
    var angle=10;
    var angleRadian=angle*Math.PI/180;
    var rotation=[Math.sin(angleRadian),Math.cos(angleRadian)];
    var color = [Math.random(), Math.random(), Math.random(), 1];
    var scale=[2,1];

    gl.viewport(0,0,canvas.width,canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        2*Float32Array.BYTES_PER_ELEMENT,
        0 //offsets
    );

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform4fv(colorLocation,color);
    gl.uniform2fv(translationLocation, translation);
    gl.uniform2fv(rotationLocation, rotation);
    gl.uniform2fv(scaleLocation,scale);

    gl.drawArrays(gl.TRIANGLES, 0, 18);

    setGeometry2(gl);

    // gl.vertexAttribPointer(
    //     positionAttribLocation,
    //     2,
    //     gl.FLOAT,
    //     gl.FALSE,
    //     2*Float32Array.BYTES_PER_ELEMENT,
    //     0 //offsets
    // );

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