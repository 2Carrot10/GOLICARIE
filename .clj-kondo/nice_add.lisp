; define nodes
Z = (>r)
S = (>r -n)
P = (>arg1 -arg2 -r)

; define functions on nodes
(P.arg1 >< Z.r) => (P.r - P.arg2)
(P.arg1 >< S.r) =>
	(
		P$1.r - P.r 
		P$1.arg1 - S.n
		P$1.arg2 - S > P.arg2
	)

; define the expression to evaluate
(graph
	P.arg1 > S > S > Z
	P.arg2 > S > Z

	print > P
)
