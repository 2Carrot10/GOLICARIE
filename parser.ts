type SExpr = string | SExpr[]

// const token_re = /(?x) \d+| \n| [[[:alpha:]]\_]+ | '.+?'|".*"+?|[=+*/%&|<>!?^~\#\-]+   | [\(\)\[\]\{\}.\:;,@]| \p/
const white_space = ["\n", " ", "\n"]
const alphanumerics = "abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ".split("")
const special_characters = "-<>!=".split("")

export class Parser {
	text: string
	i: number

	constructor(text: string) {
		this.text = text
		this.i = 0
	}

	peek_char() {
		let next_char = this.text[this.i]

		if(next_char == null) {
			throw new Error("Could not find next char")
		} else {
			return next_char
		}
	}

	next_char() {
		let next_char = this.peek_char()
		this.i++
		return next_char
	}


	next_token(): string {
		while(white_space.includes(this.peek_char())) {
			this.next_char()
			if(this.peek_char() == ";") {
				while(this.peek_char() != "\n") {
					this.next_char()
				}
			}
		}

		var start_index = this.i;
		let next = this.next_char()
		if (next == "(" || next == ")") {
		} else if (special_characters.includes(next)) {
			while(special_characters.includes(this.peek_char())) {
				this.next_char()
			}
		} else if (alphanumerics.includes(next)) {
			while(alphanumerics.includes(this.peek_char())) {
				this.next_char()
			}
		}
		return this.text.slice(start_index, this.i)
	}

	get_sexpr(): SExpr {
		let first_token = this.next_token()
		if (first_token != "(") {
			throw new Error(`Expected '(' at start of s expression. found '${first_token}'`)
		}
		let contains: SExpr[] = []
		let token: string
		while((token = this.next_token()) != ")") {
			if(token == "(") {
				this.i--; // HACK!
				contains.push(this.get_sexpr())
			} else {
				contains.push(token)
			}
		}
		return contains
	}
}
