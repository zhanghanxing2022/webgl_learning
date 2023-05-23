import * as THREE from "three";
import { Matrix4 } from "three/src/math/Matrix4";
import { Vector4 } from "three/src/math/Vector4";

export class Cube4
{
    WrapVectorV4InM4List:Array<Matrix4>=[];
    //在做旋转时，可以使得WrapVectorV4InM4List各个左乘对应矩阵，之后再使用castShadow,
    vertexV4:Array<Vector4> = [];
    vertex=[
        [[ 1, 1, 1, 1],
        [ 1, 1, 1,-1],
        [ 1, 1,-1, 1],
        [ 1, 1,-1,-1]],
    
        [[ 1,-1, 1, 1],
        [ 1,-1, 1,-1],
        [ 1,-1,-1, 1],
        [ 1,-1,-1,-1]],
    
        [[-1, 1, 1, 1],
        [-1, 1, 1,-1],
        [-1, 1,-1, 1],
        [-1, 1,-1,-1]],
    
        [[-1,-1, 1, 1],
        [-1,-1, 1,-1],
        [-1,-1,-1, 1],
        [-1,-1,-1,-1]]
    ]
    edge:Array<Array<any>>=[
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ];
    private generateCubeEdge()
    {
        const vertex=[
            [ 1, 1, 1, 1],
            [ 1, 1, 1,-1],
            [ 1, 1,-1, 1],
            [ 1, 1,-1,-1],
        
            [ 1,-1, 1, 1],
            [ 1,-1, 1,-1],
            [ 1,-1,-1, 1],
            [ 1,-1,-1,-1],
        
            [-1, 1, 1, 1],
            [-1, 1, 1,-1],
            [-1, 1,-1, 1],
            [-1, 1,-1,-1],
        
            [-1,-1, 1, 1],
            [-1,-1, 1,-1],
            [-1,-1,-1, 1],
            [-1,-1,-1,-1]
        ]
        vertex.forEach((value,index)=>
        {
        for(let i = 0; i < vertex.length;i++)
        {
            if(i==index)
            {
            continue;
            }
            let cnt = 0;
            for(let j = 0; j < value.length;j++)
            {
                if(value[j]!=vertex[i][j])
                {
                cnt++;
                }
            }
            if(cnt==1)
            {
            this.edge[index].push(i);
            }
        }
        })
    }
    castShadow()
    {
        
        const res:Array<any>=[];
        this.toVectorList().forEach((ele)=>
        {
            const a = 1/(2.1-ele[3]);
            /*
            *return new Matrix4().set( 
            *    a,0,0,0,  x
            *    0,a,0,0,* y
            *    0,0,a,0,  z
            *    0,0,0,0   w
            *   )
            */
           res.push(new THREE.Vector3(a*ele[0],a*ele[1],a*ele[2]));
        })
        return res;
    }
    /*
    *可以链式调用
    */
    rotate(kind:number,theta:number)
    {


        let res:Array<Array<number>> =[
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0],
        [0,0,0,1],
        ]
        const RotateList:Array<Array<number>>=
        [
            [0,1],
            [0,2],
            [0,3],
            [1,2],
            [1,3],
            [2,3]
        ]
        const r = theta*Math.PI/180;
        const i = RotateList[kind][0];
        const j = RotateList[kind][1];
        res[i][i] = Math.cos(r)
        res[i][j] = -Math.sin(r);
        res[j][i] = Math.sin(r)
        res[j][j]=Math.cos(r);
        const temp =  res.flat(3);
        let trans = (ele:Array<number>)=>
        {
            const a = new Matrix4();
            //列优先
            /*
            *	const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
            *   const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
            *   const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
            *   const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];
            */
            a.fromArray(ele);
            for(let i = 0; i < this.WrapVectorV4InM4List.length;i++)
            {
                this.WrapVectorV4InM4List[i] = this.WrapVectorV4InM4List[i].multiplyMatrices(a,this.WrapVectorV4InM4List[i]);
            }
            return a;
        }
        trans(temp);
        return this
    }
    reset()
    {
        this.WrapVectorV4InM4List=[];
        this.vertex.forEach(ele=>
        {
            ele.forEach(eleInner=>
            {
                this.vertexV4.push(new Vector4(...eleInner))
            })
            this.WrapVectorV4InM4List.push( new Matrix4().fromArray(ele.flat(1)));
        })

        console.log(this.WrapVectorV4InM4List)
    }
    constructor(a = 1)
    {
        this.generateCubeEdge();
        console.log(new Matrix4());
        console.log(new Vector4());
        this.reset();
    }
    private toVectorList()
    {
        const res:Array<any> =[];
        this.WrapVectorV4InM4List.forEach(ele=>
        {
            const elee = ele.elements;
            res.push([elee[0],elee[1],elee[2],elee[3]])
            res.push([elee[4],elee[5],elee[6],elee[7]])
            res.push([elee[8],elee[9],elee[10],elee[11]])
            res.push([elee[12],elee[13],elee[14],elee[15]])
        })
        return res;
    }
}