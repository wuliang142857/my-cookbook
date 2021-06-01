# Makefile for graph-api

CURRENT_PATH=$(shell pwd)
DIST_PATH=dist
NPM_LIKE=$(shell { command -v yarnpkg || command -v cnpm || command -v npm; } 2>/dev/null)

.PHONY:dev

dev:
	$(NPM_LIKE) run docs:dev

install:
	$(NPM_LIKE) install --registry=https://registry.npm.taobao.org

build:
	$(NPM_LIKE) run docs:build

clean:
	rm -rf $(CURRENT_PATH)/$(DIST_PATH)

init-username:
	git config user.name "wuliang142857"
	git config user.email "wuliang142857@gmail.com"

