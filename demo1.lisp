(
  (spiders (
            (App
              >lam
              -arg
              -ret)
            (Lam
              >abs
              -bod
              -bnd)
            (Var
              >def)
            (Sub
              >targ)))
  (rules (
((Lam$in1.abs App$in1.lam)
(App$in1.arg Lam$in1.bnd
App$in1.ret Lam$in1.bod))))
  (graph
    (
     Lam$basic.abs App$basic.lam
     App$basic.arg Sub$input.def
     App$basic.ret Var$output.targ
     Lam$basic.bod Sub$bodvar.def
     Lam$basic.bnd Var$lambdabnd.targ)))
