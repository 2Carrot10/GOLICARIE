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
               -r)))
 (rules (
         (
             (P.arg1 Z.r)
             (P.r P.arg2))
        
         (
             (P.arg1 S$test.r)
             (
                 P$0.arg1 S$test.n
                 P$0.arg2 S$0.r
                 S$0.n P.arg2))))
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
