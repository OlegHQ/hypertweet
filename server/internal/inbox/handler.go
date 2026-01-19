package inbox

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/ai"
	"github.com/hypertweet/server/internal/requestctx"
	"github.com/hypertweet/server/internal/shared"
)

type Handler struct {
	repo *Repo
	ai   *ai.Service
	log  *slog.Logger
}

func NewHandler(repo *Repo, aiService *ai.Service, log *slog.Logger) *Handler {
	return &Handler{repo: repo, ai: aiService, log: log}
}

type saveRequest struct {
	Page ai.Page `json:"page"`
}

type saveResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Key    string `json:"key"`
}

func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)

	req, err := shared.DecodeJSON[saveRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	key := computeKey(req.Page)
	if err := shared.ValidateNotEmpty("key", key); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	now := time.Now().UTC()
	item := &SavedItem{
		ID:            uuid.NewString(),
		UserID:        userID,
		Key:           key,
		Status:        StatusUnreplied,
		Page:          req.Page,
		ReplyVariants: []ReplyVariant{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	saved, err := h.repo.UpsertByKey(ctx, item)
	if err != nil {
		if errors.Is(err, ErrItemConflict) {
			shared.HandleError(w, h.log, shared.NewConflictError("inbox item already exists"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, saveResponse{ID: saved.ID, Status: saved.Status, Key: saved.Key})
}

type listResponse struct {
	Items []ItemSummary `json:"items"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)

	status := r.URL.Query().Get("status")
	if status != "" && status != StatusUnreplied && status != StatusFinished {
		shared.HandleError(w, h.log, shared.NewValidationError("status", "invalid status"))
		return
	}

	limit := 0
	if q := r.URL.Query().Get("limit"); q != "" {
		if v, err := strconv.Atoi(q); err == nil {
			limit = v
		}
	}

	items, err := h.repo.ListByStatus(ctx, userID, status, limit)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	resp := listResponse{Items: make([]ItemSummary, 0, len(items))}
	for _, it := range items {
		preview := ""
		if it.Page.ActivePost != nil {
			preview = it.Page.ActivePost.Text
		} else if len(it.Page.Posts) > 0 {
			preview = it.Page.Posts[0].Text
		}
		if len(preview) > 200 {
			preview = preview[:200]
		}
		resp.Items = append(resp.Items, ItemSummary{
			ID:           it.ID,
			Key:          it.Key,
			Status:       it.Status,
			Site:         it.Page.Site,
			Url:          it.Page.Url,
			TextPreview:  preview,
			VariantCount: len(it.ReplyVariants),
			CreatedAt:    it.CreatedAt,
			UpdatedAt:    it.UpdatedAt,
		})
	}

	shared.RespondJSON(w, http.StatusOK, resp)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)
	id := r.PathValue("id")
	if err := shared.ValidateNotEmpty("id", id); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	item, err := h.repo.FindByID(ctx, id)
	if err != nil {
		if err == ErrItemNotFound {
			shared.HandleError(w, h.log, shared.NewNotFoundError("item"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	if item.UserID != userID {
		shared.HandleError(w, h.log, shared.NewUnauthorizedError())
		return
	}

	shared.RespondJSON(w, http.StatusOK, item)
}

type addVariantsRequest struct {
	Variants []struct {
		Text string `json:"text"`
	} `json:"variants"`
}

func (h *Handler) AddVariants(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)
	id := r.PathValue("id")

	req, err := shared.DecodeJSON[addVariantsRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if len(req.Variants) == 0 {
		shared.HandleError(w, h.log, shared.NewValidationError("variants", "cannot be empty"))
		return
	}

	variants := make([]ReplyVariant, 0, len(req.Variants))
	now := time.Now().UTC()
	for _, v := range req.Variants {
		if strings.TrimSpace(v.Text) == "" {
			shared.HandleError(w, h.log, shared.NewValidationError("variants", "text cannot be empty"))
			return
		}
		variants = append(variants, ReplyVariant{
			ID:        uuid.NewString(),
			Text:      v.Text,
			Source:    "manual",
			CreatedAt: now,
		})
	}

	item, err := h.repo.AddVariants(ctx, id, userID, variants, now)
	if err != nil {
		if err == ErrItemNotFound {
			shared.HandleError(w, h.log, shared.NewNotFoundError("item"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, item)
}

func (h *Handler) MarkDone(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)
	id := r.PathValue("id")

	now := time.Now().UTC()
	item, err := h.repo.UpdateStatus(ctx, id, userID, StatusFinished, now)
	if err != nil {
		if err == ErrItemNotFound {
			shared.HandleError(w, h.log, shared.NewNotFoundError("item"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, item)
}

type generateVariantsRequest struct {
	Count int `json:"count"`
}

type generateVariantsResponse struct {
	Variants []struct {
		Text string `json:"text"`
	} `json:"variants"`
}

func (h *Handler) GenerateVariants(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := requestctx.GetUserID(ctx)
	id := r.PathValue("id")

	item, err := h.repo.FindByID(ctx, id)
	if err != nil {
		if err == ErrItemNotFound {
			shared.HandleError(w, h.log, shared.NewNotFoundError("item"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}
	if item.UserID != userID {
		shared.HandleError(w, h.log, shared.NewUnauthorizedError())
		return
	}

	count := 3
	var req generateVariantsRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.Count > 0 {
		count = req.Count
	}
	if count != 3 {
		count = 3
	}

	variantsText, err := h.ai.GenerateReplyVariants(ctx, userID, item.Page, count)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	now := time.Now().UTC()
	variants := make([]ReplyVariant, 0, len(variantsText))
	resp := generateVariantsResponse{Variants: make([]struct {
		Text string `json:"text"`
	}, 0, len(variantsText))}
	for _, t := range variantsText {
		if strings.TrimSpace(t) == "" {
			continue
		}
		variants = append(variants, ReplyVariant{ID: uuid.NewString(), Text: t, Source: "generated", CreatedAt: now})
		resp.Variants = append(resp.Variants, struct {
			Text string `json:"text"`
		}{Text: t})
	}

	if len(variants) > 0 {
		_, _ = h.repo.AddVariants(ctx, id, userID, variants, now)
	}

	shared.RespondJSON(w, http.StatusOK, resp)
}

func computeKey(page ai.Page) string {
	if page.ActivePost != nil {
		if page.ActivePost.StatusID != nil && strings.TrimSpace(*page.ActivePost.StatusID) != "" {
			return strings.TrimSpace(*page.ActivePost.StatusID)
		}
		if page.ActivePost.Url != nil && strings.TrimSpace(*page.ActivePost.Url) != "" {
			return strings.TrimSpace(*page.ActivePost.Url)
		}
	}
	if strings.TrimSpace(page.Url) != "" {
		return strings.TrimSpace(page.Url)
	}
	return ""
}
