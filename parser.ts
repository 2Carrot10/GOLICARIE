type SExpr = string | SExpr[]

// const token_re = /(?x) \d+| \n| [[[:alpha:]]\_]+ | '.+?'|".*"+?|[=+*/%&|<>!?^~\#\-]+   | [\(\)\[\]\{\}.\:;,@]| \p/
const white_space = ["\n", " ", "\n"]
const alphanumerics = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

class Parser {
	text: string
	i: number

	constructor(text: string) {
		this.text = text
		this.i = 0
	}

	function next_token(this: Parser): string {
		var start_index = this.i++;
		var curr = this.text[start_index]
		while (curr != null && !(curr in white_space)) {
			if (curr == ";") {
			} else if (curr == "(") {
			} else if (curr == ")") {
			} else if (text[i] in alphanumerics) {
				i++
			}
		}
	}
	function get_sexpr(): SExpr {
	}
}


				paren_depth
				if (paren_depth < 0) {
					throw new Error("Too many close parens!")
				}