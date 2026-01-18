.PHONY: build run test clean fmt lint watch smdctl-install smdctl-logs smdctl-rm redeploy

OUTPUT := ./bin/server

build:
	go build -o $(OUTPUT) ./cmd/server

run:
	go run ./cmd/server

watch:
	air

test:
	go test ./...

fmt:
	go fmt ./...

lint:
	go vet ./...

clean:
	rm -rf bin/

smdctl-install: build
	smdctl run \
		-e "MONGODB_URI=$(MONGODB_URI)" \
		-e "GROQ_API_KEY=$(GROQ_API_KEY)" \
		-e "GOOGLE_AI_API_KEY=$(GOOGLE_AI_API_KEY)" \
		-e "PORT=5001" \
		--restart always \
		--workdir "$(CURDIR)" \
		hypertweet -- $(OUTPUT)

smdctl-logs:
	smdctl logs -f hypertweet

smdctl-rm:
	smdctl rm -f hypertweet

redeploy:
	smdctl stop hypertweet || true
	smdctl rm -f hypertweet
	$(MAKE) smdctl-install
