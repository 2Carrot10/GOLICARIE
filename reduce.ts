import MultiGraph from "https://esm.sh/graphology";
import { Conn, Node, Rewrite } from "./objs.ts";

/**
 * This function evaluates the program. It takes in the processed code written by the user and return a graph after no
 * more beta reductions can be done.
 * @param {Node[]} node_defs: the definitions of node types. These are types; not values.
 * @param {Conn[]} connections: the initial graph of nodes. This is the program before any evaluation
 * @param {Rewrite[]} reductions: a list of rules for converting active pairs into a graph (while not changing the number of
 * connections to the rest of the graph). Continued applications of reductions is computation in this language.
 */
export function ToGraph(node_defs: typeof Node[], connections) {
  const graph = new MultiGraph();
  var book = [];
  connections.forEach((conn: {
    left: {
      type: string,
      label: string,
      port: string,
    }, right: {
      type: string,
      label: string,
      port: string,
    }
  }) => {
    if (!graph.hasNode(`${conn.left.type}$${conn.left.label}`)) {
      graph.addNode(`${conn.left.type}$${conn.left.label}`, {
        type: conn.left.type,
        global_label: conn.left.label,
      })
    }
    if (!graph.hasNode(`${conn.right.type}$${conn.right.label}`)) {
      graph.addNode(`${conn.right.type}$${conn.right.label}`, {
        type: conn.right.type,
        global_label: conn.right.label,
      })
    }
    // Figure out the directionality of the edge
    const left_node_def = node_defs.find((elem) => {return elem.name === conn.left.type});
    const right_node_def = node_defs.find((elem) => {return elem.name === conn.right.type});
    const left_port = left_node_def.ports.find((elem) => {return elem.name === conn.left.node});
    const right_port = right_node_def.ports.find((elem) => {return elem.name === conn.right.node});
    switch (`${left_port.direction}${right_port.direction}`) {
      case ">>":
        // Create active pair and register it
        book.push(
            graph.addEdgeWithKey(`${left_port.name}--${right_port.name}`, `${conn.left.type}$${conn.left.label}`,
                  `${conn.right.type}$${conn.right.label}`, {
                dir: ">-"
              }));
        break;
      case ">-":
        // Left dominates turning the '-' directed
        graph.addEdgeWithKey(`${left_port.name}--${right_port.name}`, `${conn.left.type}$${conn.left.label}`,
                `${conn.right.type}$${conn.right.label}`, {
              dir: ">-"
            });
        break;
      case "->":
        // Right dominates turning the '-' directed
        graph.addEdgeWithKey(`${right_port.name}--${left_port.name}`, `${conn.right.type}$${conn.right.label}`,
                `${conn.left.type}$${conn.left.label}`, {
              dir: "->"
            });
        break;
      case "--":
        // Fully undirected
        graph.addUndirectedEdgeWithKey(`${left_port.name}--${right_port.name}`, `${conn.left.type}$${conn.left.label}`,
                `${conn.right.type}$${conn.right.label}`, {
              dir: "--"
            });
        break;
    }
  });
  console.log(book);
}