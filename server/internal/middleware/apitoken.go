package middleware

import (
	"crypto/subtle"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/hypertweet/server/internal/apitokens"
	"github.com/hypertweet/server/internal/requestctx"
	"github.com/hypertweet/server/internal/shared"
)

type APITokenMiddleware struct {
	repo *apitokens.Repo
	log  *slog.Logger
}

func NewAPITokenMiddleware(repo *apitokens.Repo, log *slog.Logger) *APITokenMiddleware {
	return &APITokenMiddleware{repo: repo, log: log}
}

func (m *APITokenMiddleware) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			shared.RespondError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			shared.RespondError(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}

		id, secret, err := apitokens.ParseRawToken(parts[1])
		if err != nil {
			shared.RespondError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		ctx := r.Context()
		token, err := m.repo.FindByID(ctx, id)
		if err != nil {
			shared.RespondError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		if token.RevokedAt != nil {
			shared.RespondError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		expected := token.TokenHash
		got := apitokens.HashSecret(secret)
		if subtle.ConstantTimeCompare([]byte(expected), []byte(got)) != 1 {
			shared.RespondError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		now := time.Now().UTC()
		if err := m.repo.UpdateLastUsedAt(ctx, token.ID, now); err != nil {
			shared.HandleError(w, m.log, err)
			return
		}

		newCtx := requestctx.WithUserID(ctx, token.UserID)
		next.ServeHTTP(w, r.WithContext(newCtx))
	})
}
