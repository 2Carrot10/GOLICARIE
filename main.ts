// @ts-nocheck
// deno --watch-hmr --allow-all main.ts
import MultiGraph from "https://esm.sh/graphology";
import {Parser} from "./parser.ts";

// Parse args
let args = Deno.args;
if (args.length == 0) {
  console.error("Usage: deno run --allow-read main.ts <file.lisp>");
  Deno.exit(1);
}

let code = Deno.readTextFileSync(args[0]);

let nested = new Parser(code).parse(); 

function parse_wire(e) {
  const [x, port] = e.split(".");
  const [clss, name = "default"] = x.split("$");
  return {clss, name, port}
}

const Constructors = {
  // Would've called this agents b/c that is what it is called on wikipedia, but that now has the connation of LLMs which makes me want to kms.
  spiders: class {
    name: string;
    ports: string[];
    constructor(name: string, ...ports: string[]) {
      this.name = name;
      this.ports = ports;
    }
  },
  rules: class {
    inputs: string[];
    outputs: string[];
    constructor(inputs: string[], outputs: string[]) {
      this.inputs = inputs.map(parse_wire);
      this.outputs = outputs.map(parse_wire);
    }
  },
  // We are largely just using graphology for this. So all we do here is convert from the instructions into functions that graphology can understand.
  graph: class {
    graph: MultiGraph;
    constructor(args: string[]) {
      this.graph = new MultiGraph({type: "mixed"});

      let x = args.map(parse_wire);
      console.log(x);
      let prev_id = null;
      let prev_port = null;
      // Now we can add each edge to the graphology graph. We can ignore the fact that we are adding nodes that already exist, as graphology will just ignore that.
      // The way I'm doing it is a little gross, but to prevent having to explicitly declare variables, we just kinda make nodes when we see that wires refer to them
      for (let [i, {clss, name, port}] of x.entries()) {
        const id = `${crypto.randomUUID().slice(0, 8)}___${clss}$${name}`;
        if (i % 2 == 0) {
          prev_id = id;
          prev_port = port;
          this.graph.addNode(id, {clss, name, port});
        } else {
          this.graph.addNode(id, {clss, name, port});
          // We add `addDirectedEdgeWithKey` based on the agent.
          this.graph.addUndirectedEdgeWithKey(`${id}_${port}<>${prev_id}_${prev_port}`, prev_id, id);
        }
      }
      
      // Comes in pairs, so we chunk as such
      let edges = [];
      for (let i = 0; i < x.length; i += 2) {
        edges.push([x[i], x[i + 1]]);
      }

    }
  }
}
// Realized that the API of the nesting actually matched quite well to how `new Map(xss)` works

const prog = new Map(nested);
const spiders = prog.get("spiders").map((e) => new Constructors.spiders(...e));
const rules = prog.get("rules").map((e) => new Constructors.rules(...e));
const graph = new Constructors.graph(prog.get("graph"));
console.log(graph);