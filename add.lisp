(spiders
	(Z 
		>r
	)
	(S
		>r
		-n
	)
	(P
		>arg1
		-arg2
		-r
	)
)
    
  
(rules 
	(
		(P.arg1 Z.r)
		(P.r P.arg2)
	)
	(
		(P$0.arg1 S$0.r)
		(
			P$0.r P$1.r
			P$1.arg1 S$0.n
			P$1.arg2 S$1.r
			S$1.n P$0.arg2
		)
	)
)

(graph
	S$0.n Z$0.r
	S$0.r P$0.arg1
	S$1.n Z$1.r
	S$1.r S$2.n
	S$2.r P$0.arg2

	Z$2.r P$0.r
)
