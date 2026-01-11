package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port          string
	MongoURI      string
	DatabaseName  string
	JwtSecret     string
	JwtIssuer     string
	JwtAudience   string
	JwtExpiryDays int
	GroqAPIKey    string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:          getEnv("PORT", "5001"),
		MongoURI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DatabaseName:  "hypertweet",
		JwtSecret:     getEnv("JWT_SECRET", "super-secret-key-change-in-production"),
		JwtIssuer:     "HyperTweet",
		JwtAudience:   "HyperTweet",
		JwtExpiryDays: 7,
		GroqAPIKey:    os.Getenv("GROQ_API_KEY"),
	}

	if cfg.GroqAPIKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY environment variable is required")
	}

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
