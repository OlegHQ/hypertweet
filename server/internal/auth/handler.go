package auth

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/shared"
)

type Handler struct {
	repo    *UserRepo
	service *AuthService
	log     *slog.Logger
}

func NewHandler(repo *UserRepo, service *AuthService, log *slog.Logger) *Handler {
	return &Handler{repo: repo, service: service, log: log}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	req, err := shared.DecodeJSON[RegisterRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateEmail("email", req.Email); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}
	if err := shared.ValidatePassword("password", req.Password); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	existing, err := h.repo.FindByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		shared.HandleError(w, h.log, err)
		return
	}
	if existing != nil {
		shared.HandleError(w, h.log, shared.NewConflictError("user already exists"))
		return
	}

	passwordHash, err := HashPassword(req.Password)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	user := &User{
		ID:              uuid.NewString(),
		Email:           req.Email,
		PasswordHash:    passwordHash,
		DisabledToneIds: []string{},
		CreatedAt:       time.Now().UTC(),
	}

	if err := h.repo.Insert(ctx, user); err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			shared.HandleError(w, h.log, shared.NewConflictError("user already exists"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusCreated, user)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	req, err := shared.DecodeJSON[LoginRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateEmail("email", req.Email); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}
	if err := shared.ValidateNotEmpty("password", req.Password); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	user, err := h.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("user"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	if !VerifyPassword(user.PasswordHash, req.Password) {
		shared.HandleError(w, h.log, shared.NewUnauthorizedError())
		return
	}

	tokens, err := h.service.GenerateTokens(user)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	expiry := time.Now().UTC().Add(30 * 24 * time.Hour)
	if err := h.repo.UpdateRefreshToken(ctx, user.ID, tokens.RefreshToken, expiry); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, tokens)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	req, err := shared.DecodeJSON[RefreshRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateNotEmpty("refreshToken", req.RefreshToken); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	user, err := h.repo.FindByRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("user"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	tokens, err := h.service.GenerateTokens(user)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	expiry := time.Now().UTC().Add(30 * 24 * time.Hour)
	if err := h.repo.UpdateRefreshToken(ctx, user.ID, tokens.RefreshToken, expiry); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, tokens)
}
