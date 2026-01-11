package shared

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

func RespondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func RespondError(w http.ResponseWriter, status int, message string) {
	RespondJSON(w, status, ErrorResponse{Error: message})
}

func HandleError(w http.ResponseWriter, log *slog.Logger, err error) {
	status := ErrorToStatus(err)
	message := err.Error()

	if status == http.StatusInternalServerError {
		log.Error("internal error", "error", err)
		message = "internal error"
	}

	RespondError(w, status, message)
}

func DecodeJSON[T any](r *http.Request) (T, error) {
	var v T
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
		return v, NewValidationError("body", "invalid JSON")
	}
	return v, nil
}
