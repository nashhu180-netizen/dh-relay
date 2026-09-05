# ChildProcess error/close contract reference

2026-09-05 read-only reference: https://nodejs.org/api/child_process.html#event-close and #event-error.

The official documentation says failed spawn emits close after error. The other documented error causes are failed kill, failed IPC send, and AbortSignal cancellation. This validator does not send IPC or pass an AbortSignal; kill is invoked only after cleanup timers are armed. Therefore a fabricated spawn-error-without-close does not alone establish a production Node failure. A real nonexistent executable test is added to observe error then close through loader and driver. This does not prove OS teardown under arbitrary failure, and does not resolve the separate D cleanup-grace contract dispute.
