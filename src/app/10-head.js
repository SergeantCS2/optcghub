/* ===================================================================== *
 * OP TCG Hub — take __TAKE__
 *
 * PROTOCOL §8: nothing on the scan -> identify -> value -> store path may
 * touch the network. The catalogue is local. The only two remote origins are
 * declared in docs/PROVISION.md, both user-tap-only, neither load-bearing.
 *
 * AGENTS rule 3: the unit is a PRINTING (productId), never a card number.
 * MEASURED take 2 -- OP01-016 is twelve printings from $0.47 to $2,017.24.
 * ===================================================================== */
'use strict';
const TAKE = __TAKE__;

