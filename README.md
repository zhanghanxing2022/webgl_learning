[TOC]



# 项目目录及文件说明

1. 3DWalker.html	
2. Object.js	//3d模型加载
3. lib//web-gl相关库函数
4. 3DWalker.js	//html文档加载完毕首先进入的函数
5. Keyboard.js //定义键盘事件接口
6. Texture.js	//纹理加载
7. model//模型文件目录
8. BridFly.js	//小鸟飞行动画生成
9. MyCube.js	//变色立方体实现
10. fog.js		//雾化相关设置与实现
11. objLoader.js//obj模型加载
12. Camera.js	//相机相关静态属性
13. MyVector3.js	//自定义vec3运算
14. image		//贴图文件夹
15. scene.js//场景参数设置

# 开发及运行环境

- 开发：vscode
- 运行：Live Server`v5.7.9` + Google Chrome`113.0.5672.126（正式版本） (arm64)`

# 运行及使用方法

1. vscode打开项目目录
2. 安装插件Live Server
3. 使用插件启动Server
4. 使用浏览器打开http://127.0.0.1:5500/3DWalker.html
5. 长按F关闭点光源
6. WASD控制相机移动
7. JIKL控制旋转

# 开发过程

## 3D场景

### 校准相机姿势

![](https://p.ipic.vip/r4rqbx.png)

```js
Camera.at = new Vector3(CameraPara.at);
Camera.eye = new Vector3(CameraPara.eye);
Camera.up = new Vector3(CameraPara.up);
```

### 变换投影方式

![](https://p.ipic.vip/d1uaiz.png)

```js
static getMatrix() {
  return new Matrix4()
      .ortho(-20.0, 20.0, -20.0, 20.0, -10.0, 200.0)
  .setPerspective(Camera.fov,window.ratio,Camera.near,Camera.far)
      .lookAt(Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2],
          Camera.at.elements[0], Camera.at.elements[1], Camera.at.elements[2],
          Camera.up.elements[0], Camera.up.elements[1], Camera.up.elements[2]);
}
```

## 绘制三维模型

### 加载复杂模型

```js
		// Load objects
		for (let o of ObjectList) {
			let loader = new ObjectLoader(o, {'gl': this.gl}).init();
			// Add animation to bird
			// if (o.objFilePath.indexOf('bird') > 0) {
			// continue;
			// }
			this.loaders.push(loader);
		}
```



### 绘制3D渐变色箱体

```js
// Load cubeRes
		let cubeLoader = new MyCube(cubeRes, {
			'gl': this.gl,
			'activeTextureIndex': 1,
			'enableLight': true
		}).init();
		this.loaders.push(cubeLoader);
```

##   3D场景漫游

```js
/*键盘事件绑定*/
 cameraMap.set('w', 'posUp');
 cameraMap.set('s', 'posDown');

cameraMap.set('i','rotUp');
cameraMap.set('k','rotDown');
```

## 纹理

```js
    // Load texture image
    this.textureImage = new Image();
    this.textureImage.src = `./image/${this.src}`;
    this.textureImage.onload = ()=> {
      this.handleTextureLoad();
```

```js
		// Load floor
		let floorLoader = new TextureLoader(floorRes, {
			'gl': this.gl,
			'activeTextureIndex': 0,
			'enableLight': true,
			"src":"floor.jpg"
		}).init();
		this.loaders.push(floorLoader);

		// Load box
		let boxLoader = new TextureLoader(boxRes, {
			'gl': this.gl,
			'activeTextureIndex': 1,
			'enableLight': true,
			'src':"boxface.bmp"
		}).init();
		this.loaders.push(boxLoader);
```

在TextureLoader构造函数中加入参数`this.src=config.src`，表示要加载的图片的路径。

## 光照

### 更改环境光和平行光光照值  

修改片元着色器和顶点着色器。

```
    //Change DirectionLight
    // let lightDirection = new Vector3([0.15, 0.15, 0.17]);
    let lightDirection = new Vector3(sceneDirectionLight);
    lightDirection.normalize();
    this.gl.uniform3fv(this.u_LightDirection, lightDirection.elements);
    //Change AmbientLight
    // this.gl.uniform3fv(this.u_AmbientLight, new Vector3([1.2, 1.2, 1.2]).elements);
    this.gl.uniform3fv(this.u_AmbientLight, new Vector3(sceneAmbientLight).elements);
```

###   添加一个跟随相机移动的点光源

```js
   let VSHADER_SOURCE = `
   		...
      uniform vec3 u_LightPosition;//点光源位置
      uniform vec3 u_LightColor;//点光源颜色
      vec4 vertexPosition = u_ModelMatrix * a_Position;
      vec3 pointLightDirection = normalize(u_LightPosition - vec3(vertexPosition));
      float pointNDotL = max(dot(pointLightDirection, normal), 0.0);
      vec3 diffuse = u_DiffuseLight * u_Color * nDotL + u_LightColor*u_Color*pointNDotL;
      ...
      
      `
      
      render()
      {
      // Set the light color (white)
    this.gl.uniform3f(this.u_LightColor, 1-Camera.state['color'] , 1-Camera.state['color'] , 1-Camera.state['color'] );
    // Set the light direction (in the world coordinate);
    this.gl.uniform3f(this.u_LightPosition, ...Camera.at.elements);
      }
```

## 雾化

第十章![截屏2023-05-21 16.02.09](https://p.ipic.vip/d5y5lb.png)

![截屏2023-05-21 16.01.27](https://p.ipic.vip/obp26e.png)



```js
float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
          vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
          gl_FragColor = vec4(color, v_Color.a);
```

# 项目中的亮点

1. 实现雾化时减少重复代码

   设置两个函数`fogInit()`与`fogRender()`，`fogInit.call(this)`和`fogRender.call(this)`调用时使用并将所有有关雾化的设置放在同一个文件中。

2. 对开发过程进行了详细的记录

3. 发现baseCode以及sample中，键盘设置大写锁定时，ad命令失效，对这个问题惊醒了解决。

   ```js
   bind(key, callback) {
   		this.keyMap.set(key, callback);
   		this.keyMap.set(key.toUpperCase(), callback);
   
   		return this;
   	}
   ```

   

 # 项目仍然或者可能存在的缺陷

1. 在对地板实现雾化效果时，发现地板雾化效果随着相机移动变化不明显，可能只因为地板面积过大，计算雾化因子时没有密集的采样，导致对相机位置变化不敏感
