var fogDist = new Float32Array([75,150]);
var fogColor = new Float32Array([0.337, 0.331, 0.423]);
var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
function fogInit()
{
    this.u_FogColor = this.gl.getUniformLocation(this.program,"u_FogColor");
    this.u_FogDist = this.gl.getUniformLocation(this.program,"u_FogDist");
}
function fogRender()
{
    this.gl.uniform3fv(this.u_FogColor,fogColor);
    this.gl.uniform2fv(this.u_FogDist, fogDist);
}