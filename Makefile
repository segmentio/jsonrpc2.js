
BIN := node_modules/.bin

.DEFAULT_GOAL := test

node_modules: package.json
	npm install
	@touch $@

test: node_modules
	$(BIN)/mocha --bail --require co-mocha

.PHONY: test
