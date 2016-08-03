
BIN := node_modules/.bin

NODE ?= node
MOCHA_FLAGS ?=

SRC := index.js
TESTS := $(wildcard test/*.js)

.DEFAULT_GOAL := test

node_modules: package.json
	npm install
	@touch $@

test: node_modules
	$(BIN)/mocha $(MOCHA_FLAGS)

lint: node_modules
	$(BIN)/standard

coverage: $(SRC) $(TESTS) node_modules
	$(NODE) $(BIN)/istanbul cover $(BIN)/_mocha $(MOCHA_FLAGS)

clean:
	rm -rf coverage

.PHONY: test lint clean
