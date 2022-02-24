(define-constant TOTAL-SUPPLY u1380000000)
(define-fungible-token ice TOTAL-SUPPLY)

(define-data-var ice-machine principal tx-sender)
(define-map last-actions principal {freeze: uint, melt: uint})
(define-constant ACTIONS-AT-DEPLOY {freeze: block-height, melt: block-height})

;; 5% of ice can melt within a year if not used
;;(define-constant MELT-TIME u48000)
(define-constant MELT-TIME u2)
(define-constant MELT-RATE u4)
(define-constant REWARD-RATE u1)
(define-constant MIN-BALANCE u1618)

;; get the token balance of owner
(define-read-only (get-balance (owner principal))
  (begin
    (ok (ft-get-balance ice owner))))

;; get the token balance of the caller
(define-read-only (get-caller-balance)
  (begin
    (ok (ft-get-balance ice tx-sender))))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply ice)))

;; returns the token name
(define-read-only (get-name)
  (ok "Ice token"))

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "ICE"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u0))

;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u4))
    (map-set last-actions sender (merge (get-last-actions sender) {freeze: block-height}))
    (map-set last-actions recipient (merge (get-last-actions recipient) {freeze: block-height}))
    (ft-transfer? ice amount sender recipient)))

(define-public (transfer-memo (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (try! (transfer amount sender recipient))
    (print memo)
    (ok true)))

(define-public (get-token-uri)
  (ok (some u"ipfs://Qm")))

;;
;; melt functions
;;
(define-read-only (get-last-actions (user principal))
  (default-to ACTIONS-AT-DEPLOY (map-get? last-actions user)))

(define-public (heat-wave-at (user principal))
  (let (
      (user-actions (get-last-actions user))
      (user-balance (ft-get-balance ice user))
      (melt-amount (/ (* user-balance  MELT-RATE) u100))
      (reward-amount (/ (* user-balance REWARD-RATE) u100))
    )
    (asserts! (> block-height (+ (get freeze user-actions) MELT-TIME)) ERR-TOO-COLD)
    (asserts! (> block-height (+ (get melt user-actions) MELT-TIME)) ERR-TOO-HOT)
    (asserts! (>= user-balance MIN-BALANCE) ERR-TOO-LOW)
    (map-set last-actions user (merge user-actions {melt: block-height}))
    (try! (ft-transfer? ice  melt-amount user (var-get ice-machine)))
    (try! (ft-transfer? ice  reward-amount user tx-sender))
    (ok true)
  )
)


(define-public (set-ice-machine (machine principal))
  (begin
    (var-set ice-machine machine)
    (ft-mint? ice TOTAL-SUPPLY machine)))

(define-constant ERR-TOO-COLD (err u501))
(define-constant ERR-TOO-HOT (err u502))
(define-constant ERR-TOO-LOW (err u503))
