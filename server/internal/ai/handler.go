package ai

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/middleware"
	"github.com/hypertweet/server/internal/shared"
)

type Handler struct {
	service *Service
	log     *slog.Logger
}

func NewHandler(service *Service, log *slog.Logger) *Handler {
	return &Handler{service: service, log: log}
}

func (h *Handler) Reply(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[ReplyRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateNotEmpty("toneId", req.ToneID); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	h.log.Info("generating reply", "userID", userID)

	reply, err := h.service.GenerateReply(ctx, userID, req.ToneID, req.Page)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, reply)
}

func (h *Handler) Refine(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[RefineRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	h.log.Info("refining reply", "userID", userID)

	reply, err := h.service.RefineReply(ctx, userID, req.Platform, req.OriginalPost, req.DraftReply, req.RefineInstruction)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, reply)
}

func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[ChatRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if len(req.Messages) == 0 {
		shared.HandleError(w, h.log, shared.NewValidationError("messages", "cannot be empty"))
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		shared.HandleError(w, h.log, shared.NewInternalError("streaming not supported"))
		return
	}

	chatID := uuid.NewString()
	writeSSE(w, flusher, "chatId", chatID)

	_, err = h.service.StreamChat(ctx, userID, req, func(token string) error {
		return writeSSE(w, flusher, "token", token)
	})
	if err != nil {
		h.log.Error("chat stream error", "error", err)
		return
	}

	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

func writeSSE(w http.ResponseWriter, flusher http.Flusher, key, value string) error {
	data := map[string]string{key: value}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
	return nil
}
