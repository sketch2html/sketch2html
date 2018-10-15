test:
	@mocha --timeout 5000 tests/test.js -R spec

coveralls:
	@mocha --timeout 5000 tests/test.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha --timeout 5000 tests/test.js --require blanket -R html-cov > tests/covrage.html

.PHONY: test
