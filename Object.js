

"use strict";
class ObjectLoader {
	constructor(entity, config) {
		this.gl = config.gl;
		this.entity = entity;
	}

	init() {

		this.initShaders();

		this.initPerspective();

		this.g_objDoc = null;      // The information of OBJ file
		this.g_drawingInfo = null; // The information for drawing 3D model


		// Prepare empty buffer objects for vertex coordinates, colors, and normals
		this.initBuffers();
		if (!this.buffers) {
			console.log('Failed to set the vertex information');
			return;
		}

		// Start reading the OBJ file
		this.readOBJFile(`${this.entity.objFilePath}`, this.buffers, 1, true);

		return this;
	}

	initShaders() {
		// Vertex shader program
		let VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        attribute vec4 a_Normal;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_ModelMatrix;
        uniform mat4 u_NormalMatrix;
        varying vec3 v_Normal ;
        //fog
        varying float v_Dist;

        varying vec4 v_Color;
		varying vec4 v_Position;
        void main() {
          gl_Position = u_MvpMatrix * a_Position; 
          vec4 normal1 = u_NormalMatrix * a_Normal;
          v_Normal = normalize(normal1.xyz);
          v_Position = u_ModelMatrix * a_Position;
          v_Color =a_Color;
          v_Dist = gl_Position.w;
        }`;

		// Fragment shader program
		let FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform vec3 u_FogColor;
        uniform vec2 u_FogDist;

		uniform vec3 u_AmbientLight;//环境光
        uniform vec3 u_LightPosition;//点光源位置
        uniform vec3 u_LightColor;//点光源颜色
		uniform vec3 u_Color;//平行光颜色
        uniform vec3 u_LightDirection;//平行光

        varying vec4 v_Color;
        varying float v_Dist;
		varying vec3 v_Normal ;
		varying vec4 v_Position;

        void main() {
			vec3 normal = normalize(v_Normal);
			vec3 pointLightDirection = normalize(u_LightPosition - vec3(v_Position));
		  vec3 pointReflect = normalize(reflect(- pointLightDirection,normal));
		  vec3 lineReflect = normalize(reflect(- u_LightPosition,normal));

          float nDotL = max(dot(u_LightDirection, normal), 0.0);
          float pointNDotL = max(dot(pointLightDirection, normal), 0.0);//点光源（相机）反射光线与视线夹角是点光源与法向量夹角的2倍
		  float pRdotV =max(dot(pointReflect,normal),0.0);
		  float lRdotV = max(dot(lineReflect,normal),0.0);//线光源反射光线与视线夹角。
          
          vec3 u_DiffuseLight = vec3(1.0, 1.0, 1.0);
		  vec3 spec = u_LightColor*pointNDotL* u_Color;
          vec3 diffuse = u_LightColor *u_Color * pRdotV+ u_Color* lRdotV;
        //   vec3 diffuse = u_DiffuseLight * u_Color * nDotL;
          vec3 ambient = u_AmbientLight * u_Color;
		 
		  vec4 temp = vec4(spec+diffuse+ambient,v_Color.a);
          float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
          vec3 color = mix(u_FogColor, vec3(temp), fogFactor);
          gl_FragColor = vec4(color, temp.a);
        }`;

		// Initialize shaders

		this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
		if (!this.program) {
			console.log('Failed to create program');
			return;
		}
		// Initialize framebuffer object (FBO)  



		this.gl.enable(this.gl.DEPTH_TEST);

		// Get the storage locations of attribute and uniform variables
		this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
		this.a_Color = this.gl.getAttribLocation(this.program, 'a_Color');
		this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');
		this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
		this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
		this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');


		this.u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
		this.u_LightPosition = this.gl.getUniformLocation(this.program, 'u_LightPosition');
		this.u_LightColor = this.gl.getUniformLocation(this.program, 'u_LightColor');
		this.u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
		this.u_Color = this.gl.getUniformLocation(this.program, 'u_Color');
		//fog
		fogInit.call(this);


		this.gl.useProgram(this.program);
		this.gl.program = this.program;
	}

	initPerspective() {
		this.g_modelMatrix = new Matrix4();
		this.g_normalMatrix = new Matrix4();
		for (let t of this.entity.transform) {
			this.g_modelMatrix[t.type].apply(this.g_modelMatrix, t.content);
		}
	}

	initBuffers() {
		// Create a buffer object, assign it to attribute variables, and enable the assignment
		this.buffers = {
			vertexBuffer: this.gl.createBuffer(),
			normalBuffer: this.gl.createBuffer(),
			colorBuffer: this.gl.createBuffer(),
			indexBuffer: this.gl.createBuffer()
		};
	}

	readOBJFile(fileName, model, scale, reverse) {
		let request = new XMLHttpRequest();

		request.onreadystatechange = () => {
			if (request.readyState === 4 && (request.status == 200 || request.status == 0)) {
				this._onReadOBJFile(request.responseText, fileName, model, scale, reverse);
			}
		};
		request.open('GET', fileName, true);
		request.send();
	}


	_onReadOBJFile(fileString, fileName, o, scale, reverse) {
		let objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
		let result = objDoc.parse(fileString, scale, reverse); // Parse the file
		if (!result) {
			this.g_objDoc = null;
			this.g_drawingInfo = null;
			console.log("OBJ file parsing error.");
			return;
		}
		this.g_objDoc = objDoc;
	}

	render(timestamp) {
		this.gl.useProgram(this.program);
		this.gl.program = this.program;

		if (this.g_objDoc != null && this.g_objDoc.isMTLComplete()) {
			this.onReadComplete();
		}
		if (!this.g_drawingInfo) return;

		if (this.hasOwnProperty('nextFrame')) {
			this.nextFrame(timestamp);
			this.initPerspective();
		}
		if (this.animate) {
			for (let t of this.animate) {
				this.g_modelMatrix[t.type].apply(this.g_modelMatrix, t.content);
			}
		}

		//Change DirectionLight
		// let lightDirection = new Vector3([0.15, 0.15, 0.17]);
		let lightDirection = new Vector3(sceneDirectionLight);
		lightDirection.normalize();
		this.gl.uniform3fv(this.u_LightDirection, lightDirection.elements);
		//Change AmbientLight
		// this.gl.uniform3fv(this.u_AmbientLight, new Vector3([1.2, 1.2, 1.2]).elements);
		this.gl.uniform3fv(this.u_AmbientLight, new Vector3(sceneAmbientLight).elements);

		// Set the light color (white)
		this.gl.uniform3f(this.u_LightColor, 1 - Camera.state['color'], 1 - Camera.state['color'], 1 - Camera.state['color']);
		// Set the light direction (in the world coordinate);
		this.gl.uniform3f(this.u_LightPosition, ...Camera.at.elements);
		// Set the ambient light
		this.gl.uniform3fv(this.u_Color, new Vector3(this.entity.color).elements);
		//Set fog
		fogRender.call(this);

		this.g_normalMatrix.setInverseOf(this.g_modelMatrix);
		this.g_normalMatrix.transpose();
		this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.g_normalMatrix.elements);
		this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);

		let g_mvpMatrix = Camera.getMatrix();
		g_mvpMatrix.concat(this.g_modelMatrix);

		this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, g_mvpMatrix.elements);
		// Draw
		this.gl.drawElements(this.gl.TRIANGLES, this.g_drawingInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);

		this.gl.useProgram(this.shadowProgram);// Set shaders for generating a shadow map
	}

	onReadComplete() {
		// Acquire the vertex coordinates and colors from OBJ file
		this.g_drawingInfo = this.g_objDoc.getDrawingInfo();

		// Write date into the buffer object
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.vertices, this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.a_Position);


		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.normals, this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.a_Normal);


		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.colors, this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(this.a_Color, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.a_Color);

		// Write the indices to the buffer object
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.g_drawingInfo.indices, this.gl.STATIC_DRAW);

	}
}