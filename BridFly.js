var birdBegin=0;
var i = 0;
function birdFly(timestamp)
{

    let res =  [
        {type: "rotate", content: [90, 0, -1, 0]},
        {type: "translate", content: [ 1.25,-1.2, 0.2]},
        
        {type: "rotate", content: [1.2, 0, 1, 0]},

        {type: "translate", content: [ 0,0.03* Math.cos(i/20),0]},
        {type: "translate", content: [ -1.25,1.2,-0.2]},
        {type: "rotate", content: [90, 0, 1, 0]},
    ];
   
    i++;
    return res;
    //先让圆心移到原点，之后绕y轴旋转。之后上下移动，之后移回来
}