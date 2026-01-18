package mcp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hypertweet/server/internal/ai"
	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/inbox"
	"github.com/hypertweet/server/internal/profiles"
	"github.com/hypertweet/server/internal/requestctx"
	"github.com/hypertweet/server/internal/shared"
	"github.com/hypertweet/server/internal/tones"
	"go.mongodb.org/mongo-driver/bson"
)

var supportedProtocolVersions = []string{
	"2025-11-25",
	"2025-03-26",
	"2024-11-05",
}

type Handler struct {
	userRepo         *auth.UserRepo
	profileRepo      *profiles.ProfileRepo
	toneRepo         *tones.ToneRepo
	inboxRepo        *inbox.Repo
	aiService        *ai.Service
	log              *slog.Logger
	allowedOrigins   map[string]bool
	allowLocalOrigin bool
}

func NewHandler(userRepo *auth.UserRepo, profileRepo *profiles.ProfileRepo, toneRepo *tones.ToneRepo, inboxRepo *inbox.Repo, aiService *ai.Service, log *slog.Logger) *Handler {
	allowedOrigins := make(map[string]bool)
	for _, o := range strings.Split(os.Getenv("MCP_ALLOWED_ORIGINS"), ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowedOrigins[o] = true
		}
	}
	return &Handler{
		userRepo:         userRepo,
		profileRepo:      profileRepo,
		toneRepo:         toneRepo,
		inboxRepo:        inboxRepo,
		aiService:        aiService,
		log:              log,
		allowedOrigins:   allowedOrigins,
		allowLocalOrigin: true,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	origin := r.Header.Get("Origin")
	if origin != "" && !h.isAllowedOrigin(origin) {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req rpcRequest
	if err := dec.Decode(&req); err != nil {
		h.writeRPCError(w, nil, -32700, "Parse error", nil)
		return
	}

	// Notifications have no id.
	if len(req.ID) == 0 {
		w.WriteHeader(http.StatusAccepted)
		return
	}

	res := h.handleRPC(r.Context(), &req)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (h *Handler) isAllowedOrigin(origin string) bool {
	if h.allowedOrigins[origin] {
		return true
	}
	if !h.allowLocalOrigin {
		return false
	}
	if origin == "http://localhost" || strings.HasPrefix(origin, "http://localhost:") {
		return true
	}
	if origin == "http://127.0.0.1" || strings.HasPrefix(origin, "http://127.0.0.1:") {
		return true
	}
	return false
}

func (h *Handler) handleRPC(ctx context.Context, req *rpcRequest) *rpcResponse {
	switch req.Method {
	case "initialize":
		return h.handleInitialize(req)
	case "tools/list":
		return h.handleToolsList(req)
	case "tools/call":
		userID := requestctx.GetUserID(ctx)
		if userID == "" {
			return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Error: &rpcError{Code: -32001, Message: "unauthorized"}}
		}
		return h.handleToolsCall(ctx, userID, req)
	default:
		return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Error: &rpcError{Code: -32601, Message: "Method not found"}}
	}
}

func (h *Handler) handleInitialize(req *rpcRequest) *rpcResponse {
	var p initializeParams
	if len(req.Params) > 0 {
		_ = json.Unmarshal(req.Params, &p)
	}

	requested := p.ProtocolVersion
	negotiated := supportedProtocolVersions[0]
	if requested != "" {
		for _, v := range supportedProtocolVersions {
			if v == requested {
				negotiated = requested
				break
			}
		}
	}

	result := initializeResult{
		ProtocolVersion: negotiated,
		Capabilities: map[string]any{
			"tools": map[string]any{
				"listChanged": false,
			},
		},
		ServerInfo: map[string]any{
			"name":    "hypertweet",
			"title":   "Hypertweet MCP",
			"version": "0.1.0",
		},
		Instructions: "Tools for managing Hypertweet tones and profile/chat configuration.",
	}

	return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Result: result}
}

func (h *Handler) handleToolsList(req *rpcRequest) *rpcResponse {
	result := toolsListResult{Tools: h.toolDefs()}
	return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Result: result}
}

func (h *Handler) handleToolsCall(ctx context.Context, userID string, req *rpcRequest) *rpcResponse {
	var p toolCallParams
	if err := json.Unmarshal(req.Params, &p); err != nil {
		return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Error: &rpcError{Code: -32602, Message: "Invalid params"}}
	}

	tr, err := h.callTool(ctx, userID, p.Name, p.Arguments)
	if err != nil {
		// Protocol-level error: unknown tool, etc.
		return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Error: &rpcError{Code: -32601, Message: err.Error()}}
	}

	return &rpcResponse{JSONRPC: "2.0", ID: req.ID, Result: tr}
}

func (h *Handler) toolDefs() []toolDef {
	noArgs := map[string]any{"type": "object", "additionalProperties": false}
	stringField := func(name, desc string) map[string]any {
		return map[string]any{"type": "string", "description": desc}
	}

	return []toolDef{
		{
			Name:        "profile_get",
			Title:       "Get profile",
			Description: "Fetch current Hypertweet profile settings",
			InputSchema: noArgs,
		},
		{
			Name:        "inbox_list_unreplied",
			Title:       "List unreplied items",
			Description: "List saved posts/pages that still need replies",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"limit": map[string]any{"type": "number", "description": "Max items (default 50)"},
				},
				"additionalProperties": false,
			},
		},
		{
			Name:        "inbox_get",
			Title:       "Get inbox item",
			Description: "Fetch a saved item including page context and reply variants",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id": stringField("id", "Saved item id"),
				},
				"required":             []string{"id"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "inbox_add_variants",
			Title:       "Add reply variants",
			Description: "Add one or more reply variants to an inbox item (does not mark done)",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id": stringField("id", "Saved item id"),
					"variants": map[string]any{
						"type":        "array",
						"items":       map[string]any{"type": "string"},
						"description": "Reply variant texts",
					},
					"source": stringField("source", "manual|generated (default manual)"),
				},
				"required":             []string{"id", "variants"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "inbox_mark_done",
			Title:       "Mark done",
			Description: "Mark an inbox item as finished",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id": stringField("id", "Saved item id"),
				},
				"required":             []string{"id"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "inbox_generate_variants",
			Title:       "Generate variants",
			Description: "Generate 3 reply variants in one call and persist them",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id": stringField("id", "Saved item id"),
				},
				"required":             []string{"id"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "profile_update",
			Title:       "Update profile",
			Description: "Update Hypertweet profile/chat configuration",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"modelName":           stringField("modelName", "Reply model"),
					"chatModel":           stringField("chatModel", "Chat model"),
					"chatBotPersona":      stringField("chatBotPersona", "Chat system prompt/persona"),
					"userBio":             stringField("userBio", "User bio context"),
					"customReplyGuidance": stringField("customReplyGuidance", "Custom reply guidance"),
					"postProcessReply":    map[string]any{"type": "boolean"},
					"replyPromptOptions":  map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
				},
				"additionalProperties": false,
			},
		},
		{
			Name:        "models_list_available",
			Title:       "List available models",
			Description: "List valid model names for profile settings",
			InputSchema: noArgs,
		},
		{
			Name:        "tones_list",
			Title:       "List tones",
			Description: "List default and custom tones",
			InputSchema: noArgs,
		},
		{
			Name:        "tones_create",
			Title:       "Create tone",
			Description: "Create a custom tone",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"title":       stringField("title", "Tone title"),
					"instruction": stringField("instruction", "Tone instruction"),
				},
				"required":             []string{"title", "instruction"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "tones_update",
			Title:       "Update tone",
			Description: "Update a custom tone",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":          stringField("id", "Tone id"),
					"title":       stringField("title", "Tone title"),
					"instruction": stringField("instruction", "Tone instruction"),
				},
				"required":             []string{"id", "title", "instruction"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "tones_delete",
			Title:       "Delete tone",
			Description: "Delete a custom tone",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id": stringField("id", "Tone id"),
				},
				"required":             []string{"id"},
				"additionalProperties": false,
			},
		},
		{
			Name:        "tones_toggle_default",
			Title:       "Toggle default tone",
			Description: "Enable/disable a default tone",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":     stringField("id", "Default tone id"),
					"enable": map[string]any{"type": "boolean"},
				},
				"required":             []string{"id", "enable"},
				"additionalProperties": false,
			},
		},
	}
}

func (h *Handler) callTool(ctx context.Context, userID string, name string, args map[string]any) (*toolResult, error) {
	switch name {
	case "profile_get":
		profile, err := h.getOrCreateProfile(ctx, userID)
		if err != nil {
			return toolError(err), nil
		}
		return toolOK(profile), nil
	case "profile_update":
		var req profiles.UpdateProfileRequest
		if err := decodeArgs(args, &req); err != nil {
			return toolError(err), nil
		}
		if err := h.updateProfile(ctx, userID, &req); err != nil {
			return toolError(err), nil
		}
		profile, err := h.getOrCreateProfile(ctx, userID)
		if err != nil {
			return toolError(err), nil
		}
		return toolOK(profile), nil
	case "models_list_available":
		models := make([]profiles.ModelDef, len(profiles.AllModels))
		for i, m := range profiles.AllModels {
			models[i] = profiles.ModelDef{ModelName: m}
		}
		res := profiles.ModelsResponse{DefaultModel: profiles.DefaultModel, AllModels: models}
		return toolOK(res), nil
	case "tones_list":
		list, err := h.listResolvedTones(ctx, userID)
		if err != nil {
			return toolError(err), nil
		}
		return toolOK(list), nil
	case "tones_create":
		var p struct {
			Title       string `json:"title"`
			Instruction string `json:"instruction"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		if err := shared.ValidateNotEmpty("title", p.Title); err != nil {
			return toolError(err), nil
		}
		if err := shared.ValidateNotEmpty("instruction", p.Instruction); err != nil {
			return toolError(err), nil
		}
		now := time.Now().UTC()
		t := &tones.Tone{ID: uuid.NewString(), UserID: &userID, Title: p.Title, Instruction: p.Instruction, CreatedAt: now}
		if err := h.toneRepo.Insert(ctx, t); err != nil {
			return toolError(err), nil
		}
		return toolOK(tones.ToResponse(t)), nil
	case "tones_update":
		var p struct {
			ID          string `json:"id"`
			Title       string `json:"title"`
			Instruction string `json:"instruction"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		if tones.IsDefaultTone(p.ID) {
			return toolError(shared.NewValidationError("id", "cannot update default tone")), nil
		}
		if err := shared.ValidateNotEmpty("id", p.ID); err != nil {
			return toolError(err), nil
		}
		if err := shared.ValidateNotEmpty("title", p.Title); err != nil {
			return toolError(err), nil
		}
		if err := shared.ValidateNotEmpty("instruction", p.Instruction); err != nil {
			return toolError(err), nil
		}
		stored, err := h.toneRepo.FindByID(ctx, p.ID)
		if err != nil {
			return toolError(err), nil
		}
		if stored.UserID == nil || *stored.UserID != userID {
			return toolError(shared.NewUnauthorizedError()), nil
		}
		if err := h.toneRepo.Update(ctx, p.ID, p.Title, p.Instruction); err != nil {
			return toolError(err), nil
		}
		stored.Title = p.Title
		stored.Instruction = p.Instruction
		return toolOK(tones.ToResponse(stored)), nil
	case "tones_delete":
		var p struct {
			ID string `json:"id"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		if tones.IsDefaultTone(p.ID) {
			return toolError(shared.NewValidationError("id", "cannot delete default tone")), nil
		}
		stored, err := h.toneRepo.FindByID(ctx, p.ID)
		if err != nil {
			return toolError(err), nil
		}
		if stored.UserID == nil || *stored.UserID != userID {
			return toolError(shared.NewUnauthorizedError()), nil
		}
		if err := h.toneRepo.Delete(ctx, p.ID); err != nil {
			return toolError(err), nil
		}
		return toolOK(map[string]string{"message": "Deleted"}), nil
	case "tones_toggle_default":
		var p struct {
			ID     string `json:"id"`
			Enable bool   `json:"enable"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		if !tones.IsDefaultTone(p.ID) {
			return toolError(shared.NewValidationError("id", "not a default tone")), nil
		}
		if err := h.toggleDefaultTone(ctx, userID, p.ID, p.Enable); err != nil {
			return toolError(err), nil
		}
		return toolOK(map[string]any{"id": p.ID, "enabled": p.Enable}), nil
	case "inbox_list_unreplied":
		limit := 50
		var p struct {
			Limit *int `json:"limit"`
		}
		_ = decodeArgs(args, &p)
		if p.Limit != nil {
			limit = *p.Limit
		}
		items, err := h.inboxRepo.ListByStatus(ctx, userID, inbox.StatusUnreplied, limit)
		if err != nil {
			return toolError(err), nil
		}
		res := make([]inbox.ItemSummary, 0, len(items))
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
			res = append(res, inbox.ItemSummary{
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
		return toolOK(map[string]any{"items": res}), nil
	case "inbox_get":
		var p struct {
			ID string `json:"id"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		item, err := h.inboxRepo.FindByID(ctx, p.ID)
		if err != nil {
			if errors.Is(err, inbox.ErrItemNotFound) {
				return toolError(shared.NewNotFoundError("item")), nil
			}
			return toolError(err), nil
		}
		if item.UserID != userID {
			return toolError(shared.NewUnauthorizedError()), nil
		}
		return toolOK(item), nil
	case "inbox_add_variants":
		var p struct {
			ID       string   `json:"id"`
			Variants []string `json:"variants"`
			Source   *string  `json:"source"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		if err := shared.ValidateNotEmpty("id", p.ID); err != nil {
			return toolError(err), nil
		}
		if len(p.Variants) == 0 {
			return toolError(shared.NewValidationError("variants", "cannot be empty")), nil
		}
		source := "manual"
		if p.Source != nil && (*p.Source == "manual" || *p.Source == "generated") {
			source = *p.Source
		}
		now := time.Now().UTC()
		vars := make([]inbox.ReplyVariant, 0, len(p.Variants))
		for _, v := range p.Variants {
			v = strings.TrimSpace(v)
			if v == "" {
				return toolError(shared.NewValidationError("variants", "text cannot be empty")), nil
			}
			vars = append(vars, inbox.ReplyVariant{ID: uuid.NewString(), Text: v, Source: source, CreatedAt: now})
		}
		item, err := h.inboxRepo.AddVariants(ctx, p.ID, userID, vars, now)
		if err != nil {
			if errors.Is(err, inbox.ErrItemNotFound) {
				return toolError(shared.NewNotFoundError("item")), nil
			}
			return toolError(err), nil
		}
		return toolOK(item), nil
	case "inbox_mark_done":
		var p struct {
			ID string `json:"id"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		now := time.Now().UTC()
		item, err := h.inboxRepo.UpdateStatus(ctx, p.ID, userID, inbox.StatusFinished, now)
		if err != nil {
			if errors.Is(err, inbox.ErrItemNotFound) {
				return toolError(shared.NewNotFoundError("item")), nil
			}
			return toolError(err), nil
		}
		return toolOK(item), nil
	case "inbox_generate_variants":
		var p struct {
			ID string `json:"id"`
		}
		if err := decodeArgs(args, &p); err != nil {
			return toolError(err), nil
		}
		item, err := h.inboxRepo.FindByID(ctx, p.ID)
		if err != nil {
			if errors.Is(err, inbox.ErrItemNotFound) {
				return toolError(shared.NewNotFoundError("item")), nil
			}
			return toolError(err), nil
		}
		if item.UserID != userID {
			return toolError(shared.NewUnauthorizedError()), nil
		}

		variantsText, err := h.aiService.GenerateReplyVariants(ctx, userID, item.Page, 3)
		if err != nil {
			return toolError(err), nil
		}
		now := time.Now().UTC()
		vars := make([]inbox.ReplyVariant, 0, len(variantsText))
		for _, t := range variantsText {
			t = strings.TrimSpace(t)
			if t == "" {
				continue
			}
			vars = append(vars, inbox.ReplyVariant{ID: uuid.NewString(), Text: t, Source: "generated", CreatedAt: now})
		}
		if len(vars) == 0 {
			return toolOK(map[string]any{"variants": []string{}}), nil
		}
		updated, err := h.inboxRepo.AddVariants(ctx, p.ID, userID, vars, now)
		if err != nil {
			return toolError(err), nil
		}
		return toolOK(updated), nil
	default:
		return nil, fmt.Errorf("Unknown tool: %s", name)
	}
}

func (h *Handler) getOrCreateProfile(ctx context.Context, userID string) (*profiles.Profile, error) {
	profile, err := h.profileRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, profiles.ErrProfileNotFound) {
			profile = profiles.NewDefaultProfile(userID)
			if err := h.profileRepo.Upsert(ctx, profile); err != nil {
				return nil, err
			}
			return profile, nil
		}
		return nil, err
	}
	return profile, nil
}

func (h *Handler) updateProfile(ctx context.Context, userID string, req *profiles.UpdateProfileRequest) error {
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
			if !profiles.IsValidReplyPromptOption(opt) {
				return shared.NewValidationError("replyPromptOptions", "invalid option: "+opt)
			}
		}
		updates["ReplyPromptOptions"] = req.ReplyPromptOptions
	}
	if req.ModelName != nil {
		if !profiles.IsValidModel(*req.ModelName) {
			return shared.NewValidationError("modelName", "invalid model")
		}
		updates["ModelName"] = *req.ModelName
	}
	if req.ChatModel != nil {
		if !profiles.IsValidModel(*req.ChatModel) {
			return shared.NewValidationError("chatModel", "invalid model")
		}
		updates["ChatModel"] = *req.ChatModel
	}
	if req.ChatBotPersona != nil {
		updates["ChatBotPersona"] = *req.ChatBotPersona
	}

	if len(updates) == 0 {
		return shared.NewValidationError("input", "no fields to update")
	}

	return h.profileRepo.UpdateFields(ctx, userID, updates)
}

func (h *Handler) listResolvedTones(ctx context.Context, userID string) ([]tones.ToneResponse, error) {
	user, err := h.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, auth.ErrUserNotFound) {
			return nil, shared.NewNotFoundError("user")
		}
		return nil, err
	}

	userTones, err := h.toneRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	disabledMap := make(map[string]bool)
	for _, id := range user.DisabledToneIds {
		disabledMap[id] = true
	}

	resolved := make([]*tones.Tone, 0, len(userTones)+len(tones.DefaultTones))
	for _, t := range userTones {
		resolved = append(resolved, t)
	}
	for _, dt := range tones.DefaultTones {
		t := dt
		enabled := !disabledMap[t.ID]
		t.Enabled = &enabled
		resolved = append(resolved, &t)
	}

	resp := make([]tones.ToneResponse, len(resolved))
	for i, t := range resolved {
		resp[i] = tones.ToResponse(t)
	}

	return resp, nil
}

func (h *Handler) toggleDefaultTone(ctx context.Context, userID, toneID string, enable bool) error {
	user, err := h.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, auth.ErrUserNotFound) {
			return shared.NewNotFoundError("user")
		}
		return err
	}

	var newDisabled []string
	if enable {
		newDisabled = shared.SliceRemove(user.DisabledToneIds, toneID)
	} else if !shared.SliceContains(user.DisabledToneIds, toneID) {
		newDisabled = append(user.DisabledToneIds, toneID)
	} else {
		newDisabled = user.DisabledToneIds
	}

	return h.userRepo.UpdateDisabledToneIds(ctx, userID, newDisabled)
}

func decodeArgs(args map[string]any, out any) error {
	b, err := json.Marshal(args)
	if err != nil {
		return fmt.Errorf("marshal args: %w", err)
	}
	if err := json.Unmarshal(b, out); err != nil {
		return fmt.Errorf("decode args: %w", err)
	}
	return nil
}

func toolOK(v any) *toolResult {
	b, _ := json.Marshal(v)
	return &toolResult{
		Content:           []toolContent{{Type: "text", Text: string(b)}},
		StructuredContent: v,
		IsError:           false,
	}
}

func toolError(err error) *toolResult {
	return &toolResult{
		Content: []toolContent{{Type: "text", Text: err.Error()}},
		IsError: true,
	}
}

func (h *Handler) writeRPCError(w http.ResponseWriter, id json.RawMessage, code int, message string, data any) {
	w.Header().Set("Content-Type", "application/json")
	resp := &rpcResponse{JSONRPC: "2.0", ID: id, Error: &rpcError{Code: code, Message: message, Data: data}}
	json.NewEncoder(w).Encode(resp)
}
