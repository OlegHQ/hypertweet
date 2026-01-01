.PHONY: build publish deploy redeploy clean

# Build configuration
RUNTIME := linux-arm64
OUTPUT := ./publish
DEPLOY_DIR := /var/www/hypertweet
SERVICE := hypertweet.service

build:
	dotnet build -c Release

publish:
	dotnet publish -c Release -r $(RUNTIME) --self-contained true -p:PublishSingleFile=true -o $(OUTPUT)

deploy:
	sudo systemctl stop $(SERVICE)
	sudo cp -r $(OUTPUT)/* $(DEPLOY_DIR)/
	sudo systemctl start $(SERVICE)

redeploy: publish deploy

clean:
	rm -rf $(OUTPUT)
	dotnet clean
