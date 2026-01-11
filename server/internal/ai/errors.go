package ai

import "errors"

var (
	ErrRateLimited   = errors.New("rate limited")
	ErrProviderError = errors.New("AI provider error")
)
