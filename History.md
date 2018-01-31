
0.8.0 / 2018-01-30
==================

  * http request: support adding headers to the request from middleware

0.7.0 / 2017-11-13
==================

 * Fix response error check (#21)
 * Add middleware support (#18)

0.6.0 / 2017-07-31
==================

  * Add support for setting userAgent (#19)
  * Switch from Mocha to AVA (#17)
  * Rewrite with TCP support (#12)

0.5.0 / 2017-05-01
==================

  * add forceArray option and yarn lock (#16)

0.4.2 / 2017-02-02
==================

  * fix package for old versions of node (0.12) for api (#14)
  * test: fix ESOCKETTIMEDOUT code (#13)

0.4.1 / 2016-08-09
==================

  * Modify to work on node 4
  * README: mention `opts.logger`

0.4.0 / 2016-08-03
==================

  * circle: test on node v6 (#9)
  * index: add request logger support (#8)
  * standard

0.3.1 / 2016-06-15
==================

  * call: support passing non-arrays for params

0.3.0 / 2016-06-15
==================

  * adding support for async requests (#6)
  * call: add options.timeout, client: lower default timeout to 10s (#5)
  * refactor/cleanup & add real tests (#4)

0.2.3 / 2015-11-20
==================

  * fix: broken debug on successful call
  * tests: added them

0.2.2 / 2015-11-20
==================

  * adding debug logs

0.2.1 / 2015-11-04
==================

  * use var instead of let for better compat

0.2.0 / 2015-11-04
==================

  * handle error objects, which are correct according to the spec

0.1.1 / 2015-08-14
==================

  * Fixing missing comma

0.1.0 / 2015-08-14
==================

  * Handle more error scenarios

0.0.5 / 2015-06-29
==================

  * Merge pull request #1 from segmentio/fix/errors

0.0.4 / 2015-06-29
==================

  * Merge pull request #1 from segmentio/fix/errors

0.0.3 / 2015-06-17
==================

  * Reject with error instance

0.0.2 / 2015-06-17
==================

  * Check body.error to reject
