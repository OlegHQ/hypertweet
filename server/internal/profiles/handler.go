package profiles

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/middleware"
	"github.com/hypertweet/server/internal/shared"
	"go.mongodb.org/mongo-driver/bson"
)

type Handler struct {
	repo     *ProfileRepo
	userRepo *auth.UserRepo
	log      *slog.Logger
}

func NewHandler(repo *ProfileRepo, userRepo *auth.UserRepo, log *slog.Logger) *Handler {
	return &Handler{repo: repo, userRepo: userRepo, log: log}
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	profile, err := h.repo.FindByID(ctx, userID)
	if err != nil && !errors.Is(err, ErrProfileNotFound) {
		shared.HandleError(w, h.log, err)
		return
	}

	if profile == nil {
		profile = NewDefaultProfile(userID)
		if err := h.repo.Upsert(ctx, profile); err != nil {
			shared.HandleError(w, h.log, err)
			return
		}
	}

	shared.RespondJSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[UpdateProfileRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	updates := bson.M{}

	if req.UserBio != nil {
		updates["UserBio"] = *req.UserBio
	}
	if req.CustomReplyGuidance != nil {
		updates["CustomReplyGuidance"] = *req.CustomReplyGuidance
	}
	if req.PostProcessReply != nil {
		updates["PostProcessReply"] = *req.PostProcessReply
	}
	if req.ReplyPromptOptions != nil {
		for _, opt := range req.ReplyPromptOptions {
			if !IsValidReplyPromptOption(opt) {
				shared.HandleError(w, h.log, shared.NewValidationError("replyPromptOptions", "invalid option: "+opt))
				return
			}
		}
		updates["ReplyPromptOptions"] = req.ReplyPromptOptions
	}
	if req.ModelName != nil {
		if !IsValidModel(*req.ModelName) {
			shared.HandleError(w, h.log, shared.NewValidationError("modelName", "invalid model"))
			return
		}
		updates["ModelName"] = *req.ModelName
	}
	if req.ChatModel != nil {
		if !IsValidModel(*req.ChatModel) {
			shared.HandleError(w, h.log, shared.NewValidationError("chatModel", "invalid model"))
			return
		}
		updates["ChatModel"] = *req.ChatModel
	}
	if req.ChatBotPersona != nil {
		updates["ChatBotPersona"] = *req.ChatBotPersona
	}

	if len(updates) == 0 {
		shared.HandleError(w, h.log, shared.NewValidationError("input", "no fields to update"))
		return
	}

	if err := h.repo.UpdateFields(ctx, userID, updates); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondOK(w, "Ok")
}

func (h *Handler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	req, err := shared.DecodeJSON[UpdatePasswordRequest](r)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := shared.ValidatePassword("newPassword", req.NewPassword); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	if err := h.userRepo.UpdatePassword(ctx, userID, hash); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondOK(w, "Ok")
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(ctx)

	if err := h.userRepo.Delete(ctx, userID); err != nil {
		shared.HandleError(w, h.log, err)
		return
	}

	shared.RespondOK(w, "Ok")
}

func (h *Handler) ListModels(w http.ResponseWriter, r *http.Request) {
	models := make([]ModelDef, len(AllModels))
	for i, m := range AllModels {
		models[i] = ModelDef{ModelName: m}
	}

	shared.RespondJSON(w, http.StatusOK, ModelsResponse{
		DefaultModel: DefaultModel,
		AllModels:    models,
	})
}
