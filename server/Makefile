.PHONY: build run test clean fmt lint deploy watch

# Build configuration
OUTPUT := ./bin/server
DEPLOY_DIR := /var/www/hypertweet
SERVICE := hypertweet.service

# Go commands
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

# Deployment
deploy: build
	sudo systemctl stop $(SERVICE) || true
	sudo cp $(OUTPUT) $(DEPLOY_DIR)/
	sudo systemctl start $(SERVICE)
