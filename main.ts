// @ts-nocheck
// deno --watch-hmr --allow-all main.ts
import MultiGraph from "https://esm.sh/graphology";
import { Parser } from "./parser.ts";

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
  return { clss, name, port };
}

function snapshot(g: MultiGraph) {
  const nodes = [];
  const edges = [];
  g.forEachNode((id, attrs) =>
    nodes.push({ id, clss: attrs.clss, name: attrs.name }),
  );
  g.forEachEdge((id, attrs, source, target) =>
    edges.push({
      id,
      source,
      target,
      left_port: attrs.left_port,
      right_port: attrs.right_port,
    }),
  );
  return { nodes, edges };
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
    book: { node: string; port: string }[][];
    constructor(args: string[], spider_defs: spiders[]) {
      this.graph = new MultiGraph({ type: "mixed", multi: true });

      let x = args.map(parse_wire);
      const vars = new Set(x.map((el) => `${el.clss}$${el.name}`));
      const glmap = new Map(
        Array.from(vars, (el) => [
          el,
          `${crypto.randomUUID().slice(0, 8)}___${el}`,
        ]),
      );
      vars.forEach((el) => {
        this.graph.addNode(glmap.get(el), {
          clss: el.split("$")[0],
          name: el.split("$")[1],
        });
      });

      // Now we can add each edge to the graphology graph. We can ignore the fact that we are adding nodes that already exist, as graphology will just ignore that.
      // The way I'm doing it is a little gross, but to prevent having to explicitly declare variables, we just kinda make nodes when we see that wires refer to them
      let prev_id = null;
      let prev_port = null;
      for (let [i, { clss, name, port }] of x.entries()) {
        const local = `${clss}$${name}`;
        const id = glmap.get(local); // Get the global id of the local node
        if (i % 2 == 0) {
          prev_id = id;
          prev_port = port;
        } else {
          // We add `addDirectedEdgeWithKey` based on the agent.
          this.graph.addUndirectedEdgeWithKey(
            `${id}.${port}<>${prev_id}.${prev_port}`,
            prev_id, // Goes between the global ids of the nodes
            id,
            {
              left_id: id,
              right_id: prev_id,
              left_port: port,
              right_port: prev_port,
            },
          );
        }
      }

      const spider_ntp = new Map(
        Array.from(spider_defs, (el) => [
          el.name,
          new Map(
            Array.from(el.ports, (port) => [port.slice(1), port.slice(0, 1)]),
          ),
        ]),
      );
      // Comes in pairs, so we chunk as such
      let edges = [];
      for (let i = 0; i < x.length; i += 2) {
        edges.push([x[i], x[i + 1]]);
      }
      this.book = edges
        .map((el) => {
          const left_def = spider_ntp.get(el[0].clss);
          const right_def = spider_ntp.get(el[1].clss);
          const left_dir = left_def?.get(el[0].port);
          const right_dir = right_def?.get(el[1].port);
          return { dir: `${left_dir}${right_dir}`, edges: el };
        })
        .filter((el) => el.dir === ">>")
        .map((el) => {
          // Convert from local node definitions to global for the reduction to be able to use it
          return [
            {
              node: glmap.get(`${el.edges[0].clss}$${el.edges[0].name}`),
              port: el.edges[0].port,
            },
            {
              node: glmap.get(`${el.edges[1].clss}$${el.edges[1].name}`),
              port: el.edges[1].port,
            },
          ];
        });
    }
  },
};

function apply_rewrite(
  graph: graph,
  rule: rules,
  nodes: string[],
  active_pair: string,
  spider_defs: spiders[],
) {
  var external_nodes = new Map();
  for (const left_edge of graph.graph.edges(nodes[0])) {
    if (left_edge !== active_pair) {
      const outgoing_attrs = graph.graph.getEdgeAttributes(left_edge);
      const outgoing_origin = graph.graph.target(left_edge);
      if (outgoing_origin !== nodes[0]) {
        external_nodes.set(
          `${rule.inputs[0].clss}$${rule.inputs[0].name}.${outgoing_attrs.right_port}`,
          graph.graph.opposite(nodes[0], left_edge),
        );
      } else {
        external_nodes.set(
          `${rule.inputs[0].clss}$${rule.inputs[0].name}.${outgoing_attrs.left_port}`,
          graph.graph.opposite(nodes[0], left_edge),
        );
      }
    }
  }
  for (const right_edge of graph.graph.edges(nodes[1])) {
    if (right_edge !== active_pair) {
      const outgoing_attrs = graph.graph.getEdgeAttributes(right_edge);
      const outgoing_origin = graph.graph.target(right_edge);
      if (outgoing_origin !== nodes[1]) {
        external_nodes.set(
          `${rule.inputs[1].clss}$${rule.inputs[1].name}.${outgoing_attrs.right_port}`,
          graph.graph.opposite(nodes[1], right_edge),
        );
      } else {
        external_nodes.set(
          `${rule.inputs[1].clss}$${rule.inputs[1].name}.${outgoing_attrs.left_port}`,
          graph.graph.opposite(nodes[1], right_edge),
        );
      }
    }
  }
  graph.graph.dropNode(nodes[0]);
  graph.graph.dropNode(nodes[1]);
  const vars = new Set(rule.outputs.map((el) => `${el.clss}$${el.name}`));
  const glmap = new Map(
    Array.from(vars, (el) => [
      el,
      `${crypto.randomUUID().slice(0, 8)}___${el}`,
    ]),
  );
  vars.forEach((el) => {
    if (!rule.inputs.map((rule) => `${rule.clss}$${rule.name}`).includes(el)) {
      graph.graph.addNode(glmap.get(el), {
        clss: el.split("$")[0],
        name: el.split("$")[1],
      });
    }
  });

  const spider_ntp = new Map(
    Array.from(spider_defs, (el) => [
      el.name,
      new Map(
        Array.from(el.ports, (port) => [port.slice(1), port.slice(0, 1)]),
      ),
    ]),
  );
  let prev_id = null;
  let prev_port = null;
  let prev_class = null;
  let prev_name = null;
  for (let [i, { clss, name, port }] of rule.outputs.entries()) {
    const local = `${clss}$${name}`;
    const id = glmap.get(local); // Get the global id of the local node
    if (i % 2 == 0) {
      if (external_nodes.has(`${local}.${port}`)) {
        // Introduces constraint that when connecting to external nodes, they must be the first argument TODO: fix
        prev_id = external_nodes.get(`${local}.${port}`);
      } else {
        prev_id = id;
      }
      prev_port = port;
      prev_class = clss;
      prev_name = name;
    } else {
      // We add `addDirectedEdgeWithKey` based on the agent.
      var id_to_use = id;
      if (external_nodes.has(`${local}.${port}`)) {
        // Introduces constraint that when connecting to external nodes, they must be the first argument TODO: fix
        id_to_use = external_nodes.get(`${local}.${port}`);
      }

      graph.graph.addUndirectedEdgeWithKey(
        `${id_to_use}.${port}<>${prev_id}.${prev_port}`,
        prev_id, // Goes between the global ids of the nodes
        id_to_use,
        {
          left_id: id_to_use,
          right_id: prev_id,
          left_port: port,
          right_port: prev_port,
        },
      );
      if (
        spider_ntp.get(prev_class)?.get(prev_port) === ">" &&
        spider_ntp.get(clss)?.get(port) === ">"
      ) {
        graph.book.push([
          { node: glmap.get(`${prev_class}$${prev_name}`), port: prev_port },
          { node: glmap.get(local), port: port },
        ]);
      }
    }
  }
}

function reduce(
  graph: Constructors.graph,
  rules: Constructors.rules,
  spider_defs,
) {
  const snapshots = [snapshot(graph.graph)];
  const PopFromBook = () => {
    const idx = Math.floor(Math.random() * graph.book.length);
    const edge = graph.book.pop(idx);
    return edge;
  };

  while (graph.book.length > 0) {
    const target_redex: { node: string; port: string }[] = PopFromBook();
    const edge_id = graph.graph
      .edges(target_redex[0].node, target_redex[1].node)
      .find((edge) => {
        const attrs = graph.graph.getEdgeAttributes(edge);
        return (
          (attrs.left_port === target_redex[0].port &&
            attrs.right_port === target_redex[1].port) ||
          (attrs.right_port === target_redex[0].port &&
            attrs.left_port === target_redex[1].port)
        );
      });
    const flip = graph.graph.source(edge_id) === target_redex[0].node;

    const edge_attributes = graph.graph.getEdgeAttributes(edge_id);
    const left_id = edge_attributes.right_id; // NOTE: DEPENDING ON IF YOU SWAP THIS OR NOT, IT WORKS FOR SOME DEMOS AND NOT FOR OTHERS. In the future we should make this switch automated
    const right_id = edge_attributes.left_id;
    const left_node_attributes = graph.graph.getNodeAttributes(left_id);
    const right_node_attributes = graph.graph.getNodeAttributes(right_id);
    const rule_to_apply = rules.find((el) => {
      return (
        left_node_attributes.clss === el.inputs[flip ? 0 : 1].clss && // Don't ask me why these need to be flipped
        // edge_attributes.left_port === el.inputs[flip ? 0 : 1].port &&
        right_node_attributes.clss === el.inputs[flip ? 1 : 0].clss // &&
        // edge_attributes.right_port === el.inputs[flip ? 1 : 0].port
      );
    });
    console.log(rule_to_apply, flip);
    if (rule_to_apply === undefined) {
      continue;
    }
    apply_rewrite(
      graph,
      rule_to_apply,
      [left_id, right_id],
      edge_id,
      spider_defs,
    );
    snapshots.push(snapshot(graph.graph));
  }

  return snapshots;
}

// Realized that the API of the nesting actually matched quite well to how `new Map(xss)` works
const prog = new Map(nested);
const spiders = prog.get("spiders").map((e) => new Constructors.spiders(...e));
const rules = prog.get("rules").map((e) => new Constructors.rules(...e));
const graph = new Constructors.graph(prog.get("graph"), spiders);
console.log(graph);
const snapshots = reduce(graph, rules, spiders);
console.log(graph);

const template = Deno.readTextFileSync("template.html");
Deno.writeTextFileSync(
  "output.html",
  template.replace("__GRAPH_DATA__", JSON.stringify(snapshots)),
);
console.log("Wrote output.html");
