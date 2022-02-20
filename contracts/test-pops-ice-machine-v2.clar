;; Storage
;; pop-id:block-height
(define-map frozen-pops uint uint)

;; Define Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant MIN-FREEZING-BLOCKS u10)
(define-constant ICE-PER-POP-PER-BLOCK u10)
;; Define Errors
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-SWITCHED-OFF (err u500))
(define-constant ERR-TOO-EARLY (err u501))
(define-constant ERR-FATAL (err u999))

;; Define Variables
(define-data-var running bool false)


;; Freeze a Pop
(define-private (freeze (id uint))
  (let ((owner (unwrap! (unwrap! (contract-call? .test-pops-v2 get-owner id) ERR-FATAL) ERR-NOT-FOUND)))
    (asserts! (var-get running) ERR-SWITCHED-OFF)
    (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (map-insert frozen-pops id block-height) ERR-FATAL)
    (try! (contract-call? .test-pops-v2 transfer id tx-sender (as-contract tx-sender)))
    (contract-call? .test-frozen-pops-v2 mint tx-sender id)))

(define-public (freeze-three (id1 uint) (id2 uint) (id3 uint))
  (begin
    (try! (freeze id1))
    (try! (freeze id2))
    (try! (freeze id3))
    (ok true)))

(define-private (check-err (item (response bool uint)) (result (response bool uint)))
  (if (is-err item)
    item
    result))

(define-public (freeze-many (ids (list 50 uint)))
  (begin
    (asserts! (>= (len ids) u3) ERR-FATAL)
    (fold check-err (map freeze ids) (ok true))))

(define-private (defrost (id uint))
    (let ((freeze-bh (unwrap! (map-get? frozen-pops id) ERR-NOT-FOUND))
      (ice-cubes (* u10 (- block-height freeze-bh)))
      (owner (unwrap! (unwrap! (contract-call? .test-frozen-pops-v2 get-owner id) ERR-FATAL) ERR-NOT-FOUND)))
      (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED)
      (asserts! (>= block-height (+ freeze-bh MIN-FREEZING-BLOCKS)) ERR-TOO-EARLY)
      (map-delete frozen-pops id)
      (try! (contract-call? .test-frozen-pops-v2 burn id tx-sender))
      (try! (as-contract (contract-call? .test-pops-ice-v2 transfer ice-cubes tx-sender owner)))
      (try! (as-contract (contract-call? .test-pops-v2 transfer id tx-sender owner)))
      (ok true)))

(define-public (defrost-three (id1 uint) (id2 uint) (id3 uint))
  (begin
    (try! (defrost id1))
    (try! (defrost id2))
    (try! (defrost id3))
    (ok true)))

(define-public (defrost-many (ids (list 50 uint)))
  (fold check-err (map defrost ids) (ok true)))

;; Switch power on or off
(define-public (flip-power-switch)
  (begin
    (asserts! (is-eq contract-caller CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set running (not (var-get running)))
    (ok (var-get running))))

;; Get pop freeze height
(define-read-only (get-freeze-block-height (id uint))
  (unwrap! (map-get? frozen-pops id) u0)
)

;; set mint address for frozen-pops
(as-contract (contract-call? .test-frozen-pops-v2 set-mint-address))
(as-contract (contract-call? .test-pops-ice-v2 set-ice-machine tx-sender))