(define-trait sip-09-vault-trait
  (
    (pull-nft (uint principal) (response bool uint))
    (push-nft (uint) (response bool uint))
  )
)