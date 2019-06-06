test:
	@NODE_ENV=test node -r dotenv/config \
	./node_modules/.bin/mocha \
	--require regenerator-runtime/runtime \
	--require @babel/register \
	-u bdd \
	--reporter spec
.PHONY: test