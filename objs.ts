/**
 * Represents building a definition of a node from a graph. The node 
 * with the same outgoing ports based on a stream of tokens in an s-expression
 * @constructor
 * @param {string[]} tokens in the s-expr
 */
export function Node(tokens: string[]) {
  this.name = tokens.at(0);
  this.ports = tokens.slice(1).map((el) => {return {direction: el.at(0), name: el.slice(1)}});
}

/**
 * Represents building a rule to convert a local portion of a graph into a different graph 
 * with the same outgoing ports based on a stream of tokens in an s-expression
 * @constructor
 * @param {string[]} tokens in the s-expr
 */
export function Rewrite(tokens: string[]) {
	let before = tokens.at(0)
	if (before.at(1) != "><") {
		throw new Error(`Expected active pairs (\`><\` operator). Found ${before.at(1)}`);
	}
	this.left_node_type_before = before.at(0)
	this.right_node_type_before = before.at(2)
	this.after = new Conn(tokens.at(1))
}

// (conn F$1.a F$2.a) => {left: {type: "F", label: "1", node: "a"}, right: {type: "F", label: "2", node: "a"}} 
export function Conn(tokens: string[]) {
  if (tokens.length != 2) {
    throw new Error(`Connections must be defined between two ports. ${tokens.length} ports were used.`);
  }
  const left_str = tokens.at(0);
  const right_str = tokens.at(1);
  const regexp_port = /(\w+)\$([^.]+)\.(\w+)/g;
  const left_matches = [...left_str?.matchAll(regexp_port)][0];
  const right_matches = [...right_str?.matchAll(regexp_port)][0];
  return {left: {type: left_matches[1], label: left_matches[2], node: left_matches[3]},
          right: {type: right_matches[1], label: right_matches[2], node: right_matches[3]}};
}
