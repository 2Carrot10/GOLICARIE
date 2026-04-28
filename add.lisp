(
  ; Doing what I probably should've done before and yoinking examples from the Mackie paper
  ; `r` generally means `ret` for `return`
  (spiders (
            (Z 
              >r)
    
            (S
              ; This is directly connecting to any functions that may touch it
              >r
              ; And is "protecting" the number behind it.
              -n)
    
            (P
              >arg1
              -arg2
              -r)
    
            (T
              >arg1
              -arg2
              -r)))
    
  
  (rules (
          ( ; The fact that this won't react when on arg2 is actually perfectly fine. 
            ; The goal is to just move everything to the other side
            (Z.r P.arg1)
            ; Because adding to zero is a no-op, we just connect the return to the second argument
            (P.arg1 P.arg2))
          ( ; Move from the left to the right
            (S.r P$0.arg1)
            (
              ; We aren't actually "moving things around". The nodes in the active pair are deleted, but we have a reference to their edges.
              P$0.r S.r
              S.n P$1.r
              P$1.arg1 S.n
              P$0.arg2 P$1.arg2))))
  (graph
    ; Starting off simple. Adding 1 and 2 together. 
    (
      ; Successor of zero
      S$0.n Z$0.r
      ; Is first argument to the addition
      S$0.r P$0.arg1
      ; Successor of the successor of zero
      S$1.n Z$1.r
      S$1.r S$2.n
      ; Is second argument to the addition
      S$2.r P$0.arg2)))
