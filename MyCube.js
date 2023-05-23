
"use strict";

class MyCube {

	constructor(entity, config) {
		this.entity = entity;
		this.gl = config.gl;
		this.enableLight = config.enableLight;
	}

	init() {
		this.initShaders();

		this.initBuffers();

		this.initPerspective();

		return this;
	}

	initShaders() {
		// Vertex shader program
		let VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_ModelMatrix;
        varying vec4 v_Color;
        varying float v_Dist;
        void main() {
          gl_Position = u_MvpMatrix * a_Position;
          v_Color = a_Color;
          // Calculate the distance to each vertex from eye point
          v_Dist = gl_Position.w;
        }`;

		// Fragment shader program
		let FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform vec3 u_FogColor;// Color of Fog
        uniform vec2 u_FogDist;// Distance of Fog (starting point, end point)
        varying vec4 v_Color;
        varying float v_Dist;
        void main() {
          // Calculation of fog factor (factor becomes smaller as it goes further away from eye point)
          float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
          // Stronger fog as it gets further: u_FogColor * (1 - fogFactor) + v_Color * fogFactor
          vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
          gl_FragColor = vec4(color, v_Color.a);
        }`;

		// Initialize shaders
		this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
		if (!this.program) {
			console.log('Failed to create program');
			return;
		}

		this.gl.useProgram(this.program);
		this.gl.program = this.program;
		this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');
		fogInit.call(this);
	}

	initPerspective() {
		this.gl.enable(this.gl.DEPTH_TEST);
		// Get the storage location of u_MvpMatrix
		this.u_MvpMatrix = this.gl.getUniformLocation(this.gl.program, 'u_MvpMatrix');
		if (!this.u_MvpMatrix) {
			console.log('Failed to get the storage location of u_MvpMatrix');
		}


		this.g_normalMatrix = new Matrix4();
		// Assign the buffer object to a_Position and enable the assignment
		this.a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');

		this.a_Color = this.gl.getAttribLocation(this.gl.program, 'a_Color');

		this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
		this.g_modelMatrix = new Matrix4();
		this.g_modelMatrix.translate(this.entity.translate[0], this.entity.translate[1], this.entity.translate[2]);
		this.g_modelMatrix.scale(this.entity.scale[0], this.entity.scale[1], this.entity.scale[2]);

	}

	initBuffers() {
		// Write the vertex coordinates to the buffer object
		this.vertexBuffer = this.gl.createBuffer();

		// Write the indices to the buffer object
		this.vertexIndexBuffer = this.gl.createBuffer();
		if (!this.vertexBuffer || !this.vertexIndexBuffer) {
			console.log("Write the vertex coordinates to the buffer object error!")
		}
	}


	render() {
		this.gl.useProgram(this.program);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		var MyCubeverticesColors = new Float32Array(this.entity.vertex);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, MyCubeverticesColors, this.gl.STATIC_DRAW);

		var MYFSIZE = MyCubeverticesColors.BYTES_PER_ELEMENT;

		this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, MYFSIZE * 6, 0);
		this.gl.enableVertexAttribArray(this.a_Position);
		this.gl.vertexAttribPointer(this.a_Color, 3, this.gl.FLOAT, false, MYFSIZE * 6, MYFSIZE * 3);
		this.gl.enableVertexAttribArray(this.a_Color);



		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.entity.index), this.gl.STATIC_DRAW);


		// Set the eye point and the viewing volume
		this.mvpMatrix = Camera.getMatrix();
		this.mvpMatrix.concat(this.g_modelMatrix);
		//Set fog
		fogRender.call(this);

		// Pass the model view projection matrix to u_MvpMatrix
		this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);

		this.g_normalMatrix.setInverseOf(this.g_modelMatrix);
		this.g_normalMatrix.transpose();
		this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);



		// Draw the texture
		this.gl.drawElements(this.gl.TRIANGLE_STRIP, this.entity.index.length, this.gl.UNSIGNED_BYTE, 0);
	}
}

