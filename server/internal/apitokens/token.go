package apitokens

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

const TokenPrefix = "htmcp"

func GenerateSecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func HashSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func NewRawToken(id, secret string) string {
	return fmt.Sprintf("%s_%s_%s", TokenPrefix, id, secret)
}

func ParseRawToken(raw string) (id string, secret string, err error) {
	parts := strings.SplitN(strings.TrimSpace(raw), "_", 3)
	if len(parts) != 3 {
		return "", "", fmt.Errorf("invalid token format")
	}
	if parts[0] != TokenPrefix {
		return "", "", fmt.Errorf("invalid token prefix")
	}
	if parts[1] == "" || parts[2] == "" {
		return "", "", fmt.Errorf("invalid token format")
	}
	return parts[1], parts[2], nil
}
