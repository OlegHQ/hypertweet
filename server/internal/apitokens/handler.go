package apitokens

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/requestctx"
	"github.com/hypertweet/server/internal/shared"
)

type Handler struct {
	repo *Repo
	log  *slog.Logger
}

func NewHandler(repo *Repo, log *slog.Logger) *Handler {
	return &Handler{repo: repo, log: log}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)

	tokens, err := h.repo.ListByUserID(ctx, userID)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, ListResponse{Tokens: tokens})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)

	req, err := shared.DecodeJSON[CreateRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}
	if err := shared.ValidateNotEmpty("name", req.Name); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	id := uuid.NewString()
	secret, err := GenerateSecret()
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	now := time.Now().UTC()
	token := &APIToken{
		ID:        id,
		UserID:    userID,
		Name:      req.Name,
		TokenHash: HashSecret(secret),
		CreatedAt: now,
	}

	if err := h.repo.Insert(ctx, token); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusCreated, CreateResponse{
		ID:        id,
		Name:      req.Name,
		Token:     NewRawToken(id, secret),
		CreatedAt: now,
	})
}

func (h *Handler) Revoke(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)
	tokenID := r.PathValue("id")

	if tokenID == "" {
		shared.HandleError(w, h.log, shared.NewValidationError("id", "missing token id"))
		return
	}

	now := time.Now().UTC()
	if err := h.repo.Revoke(ctx, tokenID, userID, now); err != nil {
		if errors.Is(err, ErrTokenNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("apiToken"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondOK(w, "Revoked")
}
