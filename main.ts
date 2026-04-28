// @ts-nocheck
// deno --watch-hmr --allow-all main.ts
import MultiGraph from "https://esm.sh/graphology";
import {ToGraph} from "./reduce.ts"
import {Parser} from "./parser.ts";
import * as O from "./objs.ts";

let code = `
(
  (node Qsort
    -ret
    > in
  )
  (node Cons
    -ret
    -x
    >xs
  )
  (node F
    -a
    >b)
  (conn F$1.a F$2.a)
  (conn F$1.b F$2.b)
)
`


// Remade the python thing I wrote for showing nested arrays
const THRESHOLD = 30;
function show_nested(val: any, depth = 0): string {
  // Non arrays are leaf nodes
  if (!Array.isArray(val)) {
    return JSON.stringify(val);
  }

  // Recursive call for children
  const sub_args = val.map((item) => show_nested(item, depth + 1));
  
  // Calculate potential single-line length
  // [item1, item2] -> adds roughly 2 brackets + (commas * count)
  const totalLength = sub_args.reduce((acc, s) => acc + s.length, 0) + (sub_args.length * 2);

  if (totalLength <= THRESHOLD) {
    return `[${sub_args.join(", ")}]`;
  }

  // For multi-lines
  const indentation = "  ".repeat(depth + 1);
  const args_str = sub_args.join(`,\n${indentation}`);

  return `[${args_str}]`;
}

let nested = new Parser(code).get_sexpr(); 

// let structured = nested.flatMap((el: any) => {
//   const type = el.shift(0);
//   if (type == "node") {
// 	  return [new Node(el)]
//   } else if (type == "=>") { 
// 	  return [new Match(el)]
//   } else { 
// 	  return [];
//   }
// })


// let nodes = [];
let info = new Map([
  ["nodes", []],
  ["conn", []],
  ["rewrites", []]
])
console.log("nested:", nested)
nested.forEach((el: any) => {
  const type = el.shift(0);
  if (type == "node") {
    info.get("nodes").push(new O.Node(el))
  } else if (type == "conn") {
	info.get("conn").push(new O.Conn(el));
  } else if (type == "=>") {
    info.get("rewrites").push(new O.Rewrite(el));
  }
})
console.log(info)
ToGraph(info.get("nodes"), info.get("conn"))

//console.log(info.get("conn").at(0).constructor.name);


// let [_, agent_type, ] = 

// console.log(show_nested(nested));
