package shared

import (
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func ValidateNotEmpty(field, value string) error {
	if strings.TrimSpace(value) == "" {
		return NewValidationError(field, "cannot be empty")
	}
	return nil
}

func ValidateMinLength(field, value string, minLen int) error {
	if len(value) < minLen {
		return &ValidationError{
			Field:   field,
			Message: "must be at least " + string(rune('0'+minLen)) + " characters",
		}
	}
	return nil
}

func ValidateEmail(field, value string) error {
	if err := ValidateNotEmpty(field, value); err != nil {
		return err
	}
	if !emailRegex.MatchString(value) {
		return NewValidationError(field, "invalid email format")
	}
	return nil
}

func ValidatePassword(field, value string) error {
	if err := ValidateNotEmpty(field, value); err != nil {
		return err
	}
	if len(value) < 8 {
		return NewValidationError(field, "must be at least 8 characters")
	}
	return nil
}
