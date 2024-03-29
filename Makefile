test:
	@NODE_ENV=test node -r dotenv/config \
	./node_modules/.bin/nyc \
	--require regenerator-runtime/runtime \
	--require @babel/register \
	mocha \
	--timeout 10000 \
	--exit \
	&& ./node_modules/.bin/nyc report --reporter=text-lcov | coveralls

.PHONY: test