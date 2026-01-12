package ai

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/profiles"
	"github.com/hypertweet/server/internal/tones"
	"github.com/hypertweet/server/internal/tracing"
)

type Service struct {
	groq        *GroqClient
	userRepo    *auth.UserRepo
	profileRepo *profiles.ProfileRepo
	toneRepo    *tones.ToneRepo
	traceRepo   *tracing.TraceRepo
	log         *slog.Logger
}

func NewService(groq *GroqClient, userRepo *auth.UserRepo, profileRepo *profiles.ProfileRepo, toneRepo *tones.ToneRepo, traceRepo *tracing.TraceRepo, log *slog.Logger) *Service {
	return &Service{
		groq:        groq,
		userRepo:    userRepo,
		profileRepo: profileRepo,
		toneRepo:    toneRepo,
		traceRepo:   traceRepo,
		log:         log,
	}
}

func (s *Service) GenerateReply(ctx context.Context, userID, toneID string, page Page) (*ReplyResponse, error) {
	user, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	tone, err := s.resolveTone(ctx, userID, toneID, user)
	if err != nil {
		return nil, err
	}

	model := profiles.DefaultModel
	if profile != nil {
		model = profile.ModelName
	}

	var userBio, customGuidance *string
	var options []string
	postProcess := true
	if profile != nil {
		userBio = profile.UserBio
		customGuidance = profile.CustomReplyGuidance
		options = profile.ReplyPromptOptions
		if profile.PostProcessReply != nil {
			postProcess = *profile.PostProcessReply
		}
	}

	prompt := BuildReplyPrompt(tone, page, userBio, customGuidance, options)
	messages := []Message{{Role: "user", Content: prompt}}

	start := time.Now()
	completion, err := s.groq.Complete(ctx, model, messages)
	if err != nil {
		return nil, err
	}
	duration := time.Since(start)

	if postProcess {
		completion = applyPostProcess(completion)
	}

	event := &tracing.TraceEvent{
		Type:       "reply",
		UserID:     userID,
		Model:      model,
		Prompt:     prompt,
		Response:   completion,
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		return nil, err
	}

	return &ReplyResponse{
		EventID: eventID,
		Reply:   completion,
	}, nil
}

func (s *Service) RefineReply(ctx context.Context, userID, platform, originalPost, draftReply, instruction string) (*ReplyResponse, error) {
	_, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	model := profiles.DefaultModel
	if profile != nil {
		model = profile.ModelName
	}

	var userBio, customGuidance *string
	var options []string
	postProcess := true
	if profile != nil {
		userBio = profile.UserBio
		customGuidance = profile.CustomReplyGuidance
		options = profile.ReplyPromptOptions
		if profile.PostProcessReply != nil {
			postProcess = *profile.PostProcessReply
		}
	}

	prompt := BuildRefinePrompt(platform, originalPost, draftReply, instruction, userBio, customGuidance, options)
	messages := []Message{{Role: "user", Content: prompt}}

	start := time.Now()
	completion, err := s.groq.Complete(ctx, model, messages)
	if err != nil {
		return nil, err
	}
	duration := time.Since(start)

	if postProcess {
		completion = applyPostProcess(completion)
	}

	event := &tracing.TraceEvent{
		Type:       "refine",
		UserID:     userID,
		Model:      model,
		Prompt:     prompt,
		Response:   completion,
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		return nil, err
	}

	return &ReplyResponse{
		EventID: eventID,
		Reply:   completion,
	}, nil
}

func (s *Service) StreamChat(ctx context.Context, userID string, chatReq ChatRequest, onToken func(string) error) (string, error) {
	_, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return "", err
	}

	model := profiles.DefaultModel
	if profile != nil {
		if profile.ChatModel != nil {
			model = *profile.ChatModel
		} else {
			model = profile.ModelName
		}
	}

	var persona, userBio *string
	var options []string
	if profile != nil {
		persona = profile.ChatBotPersona
		userBio = profile.UserBio
		options = profile.ReplyPromptOptions
	}

	systemPrompt := BuildChatPrompt(persona, chatReq.PageContext, userBio, options)

	messages := []Message{{Role: "system", Content: systemPrompt}}
	for _, m := range chatReq.Messages {
		role := m.Role
		if role != "user" && role != "assistant" {
			continue
		}
		messages = append(messages, Message{Role: role, Content: m.Content})
	}

	var responseBuilder strings.Builder
	start := time.Now()

	err = s.groq.Stream(ctx, model, messages, func(token string) error {
		processed := applyPostProcess(token)
		responseBuilder.WriteString(processed)
		return onToken(processed)
	})
	if err != nil {
		return "", err
	}

	duration := time.Since(start)

	event := &tracing.TraceEvent{
		Type:       "chat",
		UserID:     userID,
		Model:      model,
		Prompt:     systemPrompt,
		Response:   responseBuilder.String(),
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		s.log.Error("failed to save chat trace", "error", err, "userID", userID)
	}

	return eventID, nil
}

func (s *Service) resolveUserProfile(ctx context.Context, userID string) (*auth.User, *profiles.Profile, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	profile, err := s.profileRepo.FindByID(ctx, userID)
	if err != nil && !errors.Is(err, profiles.ErrProfileNotFound) {
		return nil, nil, err
	}

	return user, profile, nil
}

func (s *Service) resolveTone(ctx context.Context, userID, toneID string, user *auth.User) (*tones.Tone, error) {
	if tones.IsDefaultTone(toneID) {
		tone := tones.GetDefaultTone(toneID)
		if tone == nil {
			return nil, tones.ErrToneNotFound
		}
		return tone, nil
	}

	tone, err := s.toneRepo.FindByID(ctx, toneID)
	if err != nil {
		return nil, err
	}

	return tone, nil
}

func applyPostProcess(text string) string {
	result := text
	result = strings.ReplaceAll(result, "\u2014", ", ")  // em dash
	result = strings.ReplaceAll(result, "\u2019", "'")   // right single quote
	result = strings.ReplaceAll(result, "\u201c", "\"")  // left double quote
	result = strings.ReplaceAll(result, "\u00a0", " ")   // non-breaking space
	result = strings.ReplaceAll(result, "\u2018", "'")   // left single quote
	result = strings.ReplaceAll(result, "\u201d", "\"")  // right double quote
	result = strings.ReplaceAll(result, "\u2026", "...") // ellipsis
	return result
}
