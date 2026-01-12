package shared

import (
	"errors"
	"fmt"
	"net/http"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict")
	ErrRateLimited  = errors.New("rate limited")
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

type DomainError struct {
	Err     error
	Message string
	Status  int
}

func (e *DomainError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Err.Error()
}

func (e *DomainError) Unwrap() error {
	return e.Err
}

func NewNotFoundError(entity string) *DomainError {
	return &DomainError{
		Err:     ErrNotFound,
		Message: fmt.Sprintf("%s not found", entity),
		Status:  http.StatusNotFound,
	}
}

func NewUnauthorizedError() *DomainError {
	return &DomainError{
		Err:     ErrUnauthorized,
		Message: "unauthorized",
		Status:  http.StatusUnauthorized,
	}
}

func NewConflictError(message string) *DomainError {
	return &DomainError{
		Err:     ErrConflict,
		Message: message,
		Status:  http.StatusConflict,
	}
}

func NewRateLimitedError(message string) *DomainError {
	return &DomainError{
		Err:     ErrRateLimited,
		Message: message,
		Status:  http.StatusTooManyRequests,
	}
}

func NewInternalError(message string) *DomainError {
	return &DomainError{
		Err:     errors.New("internal error"),
		Message: message,
		Status:  http.StatusInternalServerError,
	}
}

func NewValidationError(field, message string) *ValidationError {
	return &ValidationError{
		Field:   field,
		Message: message,
	}
}

func ErrorToStatus(err error) int {
	var domainErr *DomainError
	if errors.As(err, &domainErr) {
		return domainErr.Status
	}

	var valErr *ValidationError
	if errors.As(err, &valErr) {
		return http.StatusBadRequest
	}

	return http.StatusInternalServerError
}
