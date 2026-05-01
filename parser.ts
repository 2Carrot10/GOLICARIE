type SExpr = string | SExpr[]

// const token_re = /(?x) \d+| \n| [[[:alpha:]]\_]+ | '.+?'|".*"+?|[=+*/%&|<>!?^~\#\-]+   | [\(\)\[\]\{\}.\:;,@]| \p/
const white_space = ["\n", " ", "\t"]

export class Parser {
	text: string
	i: number

	constructor(text: string) {
		this.text = text
		this.i = 0
	}

	peek_char() {
		let next_char = this.text[this.i]

		if (next_char == null) {
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
		while (true) {
			while (white_space.includes(this.peek_char())) {
				this.next_char()
			}
			if (this.peek_char() == ";") {
				while (this.peek_char() != "\n" && this.peek_char() != null) {
					this.next_char()
				}
			} else {
				break
			}
		}

		if (this.i >= this.text.length) {
			throw new Error("Unexpected end of input")
		}

		let next = this.peek_char()
		if (next == "(" || next == ")") {
			this.next_char()
			return next
		} else {
			let start = this.i
			while (this.i < this.text.length && !white_space.includes(this.text[this.i]) && this.text[this.i] != "(" && this.text[this.i] != ")" && this.text[this.i] != ";") {
				this.i++
			}
			return this.text.slice(start, this.i)
		}
	}

	peek_token(): string | null {
		let saved_i = this.i
		let next
		try {
			next = this.next_token()
		} catch {
			return null
		}
		this.i = saved_i
		return next
	}

	expect_token(expectation: string): string {
		let next = this.next_token()
		if (next != expectation) {
			throw new Error(`Expected '${expectation}' at start of s expression. found '${next}'`)
		}
		return next
	}

	consume_token_if_equals(expectation: string): boolean {
		let next = this.peek_token()
		if (next == expectation) {
			this.next_token()
			return true
		} else {
			return false
		}
	}

	parse(): SExpr[] {
		let sexpr: SExpr[] = []
		// let sexpr = this.get_sexpr()
		// We want the final token request to fail
		try { this.peek_token() } catch (error) {
			return sexpr
		}

		while(this.peek_token()) {
			sexpr.push(this.get_sexpr())
		}
		return sexpr
		//  throw new Error(`Text found at the end of final ')': '${this.text.slice(this.i - 10, this.i + 100)}'`)
	}

	get_sexpr(): SExpr {
		console.log("Next token", this.peek_token())
		this.expect_token("(")
		let contains: SExpr[] = []
		while (!this.consume_token_if_equals(")")) {
			if (this.peek_token() == "(") {
				contains.push(this.get_sexpr())
			} else {
				contains.push(this.next_token())
			}
		}
		return contains
	}

	take(): [string, SExpr] {
		return [this[0], this.slice(1)]
	}
}
