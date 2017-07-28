
BIN := node_modules/.bin

NODE ?= node

SRC := index.js
TESTS := $(wildcard test/*.js)

.DEFAULT_GOAL := test

node_modules: package.json
	npm install
	@touch $@

test: node_modules
	$(BIN)/ava

lint: node_modules
	$(BIN)/standard

clean:
	rm -rf coverage

.PHONY: test lint clean
