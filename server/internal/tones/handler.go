package tones

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/middleware"
	"github.com/hypertweet/server/internal/shared"
)

type Handler struct {
	repo     *ToneRepo
	userRepo *auth.UserRepo
	log      *slog.Logger
}

func NewHandler(repo *ToneRepo, userRepo *auth.UserRepo, log *slog.Logger) *Handler {
	return &Handler{repo: repo, userRepo: userRepo, log: log}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	user, err := h.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, auth.ErrUserNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("user"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	userTones, err := h.repo.FindByUserID(ctx, userID)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	resolvedTones := makeResolvedTones(user, userTones)
	responses := make([]ToneResponse, len(resolvedTones))
	for i, t := range resolvedTones {
		responses[i] = ToResponse(t)
	}

	shared.RespondJSON(w, http.StatusOK, responses)
}

func makeResolvedTones(user *auth.User, userTones []*Tone) []*Tone {
	disabledMap := make(map[string]bool)
	for _, id := range user.DisabledToneIds {
		disabledMap[id] = true
	}

	result := make([]*Tone, 0, len(userTones)+len(DefaultTones))

	for _, t := range userTones {
		result = append(result, t)
	}

	for _, dt := range DefaultTones {
		tone := dt
		enabled := !disabledMap[tone.ID]
		tone.Enabled = &enabled
		result = append(result, &tone)
	}

	return result
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[CreateToneRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateNotEmpty("title", req.Title); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}
	if err := shared.ValidateNotEmpty("instruction", req.Instruction); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	tone := &Tone{
		ID:          uuid.NewString(),
		UserID:      &userID,
		Title:       req.Title,
		Instruction: req.Instruction,
		CreatedAt:   time.Now().UTC(),
	}

	if err := h.repo.Insert(ctx, tone); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusCreated, map[string]string{"id": tone.ID})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)
	toneID := r.PathValue("id")

	req, err := shared.DecodeJSON[UpdateToneRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidateNotEmpty("title", req.Title); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}
	if err := shared.ValidateNotEmpty("instruction", req.Instruction); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	tone, err := h.repo.FindByID(ctx, toneID)
	if err != nil {
		if errors.Is(err, ErrToneNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("tone"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	if tone.UserID == nil || *tone.UserID != userID {
		shared.HandleError(w, h.log, shared.NewUnauthorizedError())
		return
	}

	if err := h.repo.Update(ctx, toneID, req.Title, req.Instruction); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, map[string]string{"message": "Updated"})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)
	toneID := r.PathValue("id")

	if IsDefaultTone(toneID) {
		shared.HandleError(w, h.log, shared.NewValidationError("toneId", "cannot delete default tone"))
		return
	}

	tone, err := h.repo.FindByID(ctx, toneID)
	if err != nil {
		if errors.Is(err, ErrToneNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("tone"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	if tone.UserID == nil || *tone.UserID != userID {
		shared.HandleError(w, h.log, shared.NewUnauthorizedError())
		return
	}

	if err := h.repo.Delete(ctx, toneID); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondJSON(w, http.StatusOK, map[string]string{"message": "Deleted"})
}

func (h *Handler) ToggleDefault(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)
	toneID := r.PathValue("id")

	if !IsDefaultTone(toneID) {
		shared.HandleError(w, h.log, shared.NewValidationError("toneId", "not a default tone"))
		return
	}

	enableStr := r.URL.Query().Get("enable")
	enable := enableStr != "false"

	user, err := h.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, auth.ErrUserNotFound) {
			shared.HandleError(w, h.log, shared.NewNotFoundError("user"))
			return
		}
		shared.HandleError(w, h.log, err)
		return
	}

	var newDisabled []string
	if enable {
		for _, id := range user.DisabledToneIds {
			if id != toneID {
				newDisabled = append(newDisabled, id)
			}
		}
	} else {
		newDisabled = user.DisabledToneIds
		found := false
		for _, id := range newDisabled {
			if id == toneID {
				found = true
				break
			}
		}
		if !found {
			newDisabled = append(newDisabled, toneID)
		}
	}

	if err := h.userRepo.UpdateDisabledToneIds(ctx, userID, newDisabled); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	message := "Enabled"
	if !enable {
		message = "Disabled"
	}
	shared.RespondJSON(w, http.StatusOK, map[string]string{"message": message})
}
