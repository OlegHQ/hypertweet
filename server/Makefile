.PHONY: build publish deploy redeploy clean restore paket-install paket-update

# Build configuration
RUNTIME := linux-arm64
OUTPUT := ./publish
DEPLOY_DIR := /var/www/hypertweet
SERVICE := hypertweet.service

# Paket commands
paket-install:
	dotnet tool restore
	dotnet paket install

paket-update:
	dotnet paket update

restore:
	dotnet paket restore

build: restore
	dotnet build -c Release

publish: restore
	dotnet publish -c Release -r $(RUNTIME) --self-contained true -p:PublishSingleFile=true -o $(OUTPUT)

deploy:
	sudo systemctl stop $(SERVICE)
	sudo cp -r $(OUTPUT)/* $(DEPLOY_DIR)/
	sudo systemctl start $(SERVICE)

redeploy: publish deploy

clean:
	rm -rf $(OUTPUT)
	rm -rf paket-files
	dotnet clean
