(
  ; Doing what I probably should've done before and yoinking examples from the Mackie paper
  ; `r` generally means `ret` for `return`
  (spiders (
            (Z
              >r
              -conn)
            (A
              >r)))
  (rules (
          ((Z.r A.r)
           (A$0.r Z.conn))))
  (graph
    (
     Z$0.r A$0.r
     Z$0.conn Z$1.conn
     Z$1.r A$1.r)))
